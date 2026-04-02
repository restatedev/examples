// Client-side encryption of state entries.
//
// State stored via restate.Set is encrypted before leaving the SDK and
// decrypted on read-back with restate.Get. Restate never sees plaintext
// state values. Handler inputs and outputs are plain JSON -- only the
// persisted state is encrypted.
//
// WARNING: This is a MINIMAL EXAMPLE to illustrate the codec interface. DO NOT
// use this in production. Rolling your own cryptographic protocol can be
// dangerous and leads to subtle, exploitable vulnerabilities (nonce reuse,
// lack of key rotation, no authenticated context, timing side-channels, etc.).
//
// For production use, see the reference implementation of encryption codec for
// TypeScript built on AWS KMS:
//
//	https://github.com/restatedev/journal-encryption/
//
// It handles key management, envelope encryption, and authenticated encryption
// correctly using AWS KMS. KMS key rotation is supported transparently because
// each payload embeds its own wrapped DEK.
//
// This example uses a custom encoding.Codec that wraps the default JSON codec
// with AES-256-GCM encryption, passed per-operation via restate.WithCodec.
//
// Requires sdk-go >= v0.24.0 for the NonDeterministicSerializer interface,
// which tells the state machine that re-encoding the same value may produce
// different bytes (true for any encryption with random nonces).
package main

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"log"
	"os"

	restate "github.com/restatedev/sdk-go"
	"github.com/restatedev/sdk-go/encoding"
	"github.com/restatedev/sdk-go/server"
)

// encryptingCodec wraps an inner Codec, encrypting the serialized bytes with
// AES-256-GCM. It can be passed to any SDK operation via restate.WithCodec to
// selectively encrypt specific journal entries (state, run results, etc.).
type encryptingCodec struct {
	inner encoding.Codec
	aead  cipher.AEAD
}

func newEncryptingCodec(inner encoding.Codec, keyHex string) (*encryptingCodec, error) {
	key, err := hex.DecodeString(keyHex)
	if err != nil {
		return nil, fmt.Errorf("decode key: %w", err)
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, fmt.Errorf("create cipher: %w", err)
	}
	aead, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("create GCM: %w", err)
	}
	return &encryptingCodec{inner: inner, aead: aead}, nil
}

func (c *encryptingCodec) Marshal(v any) ([]byte, error) {
	plaintext, err := c.inner.Marshal(v)
	if err != nil {
		return nil, err
	}
	nonce := make([]byte, c.aead.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, fmt.Errorf("generate nonce: %w", err)
	}
	// nonce is prepended to the ciphertext
	return c.aead.Seal(nonce, nonce, plaintext, nil), nil
}

func (c *encryptingCodec) Unmarshal(data []byte, v any) error {
	nonceSize := c.aead.NonceSize()
	if len(data) < nonceSize {
		return fmt.Errorf("ciphertext too short")
	}
	nonce, ciphertext := data[:nonceSize], data[nonceSize:]
	plaintext, err := c.aead.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return fmt.Errorf("decrypt: %w", err)
	}
	return c.inner.Unmarshal(plaintext, v)
}

// AES-GCM with a random nonce produces different ciphertext each time.
func (c *encryptingCodec) IsNonDeterministic() bool { return true }

// --- Example service using the encrypting codec ---

type SecretStore struct {
	codec encoding.Codec
}

// Store and Retrieve use restate.WithCodec to encrypt/decrypt state. Only the
// operations that pass WithCodec are encrypted; handler inputs and outputs
// remain plain JSON. You can apply WithCodec to Run, Awakeable, etc. too.

func (s SecretStore) Store(ctx restate.ObjectContext, secret string) error {
	restate.Set(ctx, "secret", secret, restate.WithCodec(s.codec))
	return nil
}

func (s SecretStore) Retrieve(ctx restate.ObjectSharedContext) (string, error) {
	secret, err := restate.Get[*string](ctx, "secret", restate.WithCodec(s.codec))
	if err != nil {
		return "", err
	}
	if secret == nil {
		return "", restate.TerminalErrorf("no secret stored")
	}
	return *secret, nil
}

func main() {
	// In production, load from a secrets manager -- not an env var.
	keyHex := os.Getenv("ENCRYPTION_KEY")
	if keyHex == "" {
		// Generate a random 256-bit key for demo purposes.
		key := make([]byte, 32)
		if _, err := rand.Read(key); err != nil {
			log.Fatal(err)
		}
		keyHex = hex.EncodeToString(key)
		log.Printf("Generated demo encryption key: %s", keyHex)
	}

	codec, err := newEncryptingCodec(encoding.JSONCodec, keyHex)
	if err != nil {
		log.Fatal(err)
	}

	if err := server.NewRestate().
		Bind(restate.Reflect(SecretStore{codec: codec})).
		Start(context.Background(), ":9080"); err != nil {
		log.Fatal(err)
	}
}

/*
Run Restate and register this service, then try:

  curl localhost:8080/SecretStore/my-key/Store \
    -H 'content-type: application/json' \
    -d '"my-secret-value"'

  curl localhost:8080/SecretStore/my-key/Retrieve

The state stored in Restate is AES-256-GCM encrypted;
Restate never sees the plaintext.
*/
