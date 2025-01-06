package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net"
	"net/http"
	"time"

	"github.com/google/uuid"
)

const RESTATE_URL = "http://localhost:8080"

func upload(id string, email string) error {
	slog.Info(fmt.Sprintf("Start upload for %s", id))

	client := &http.Client{Timeout: 5 * time.Second}

	url := fmt.Sprintf("%s/DataUploadService/%s/Run", RESTATE_URL, id)
	resp, err := client.Get(url)
	if err != nil {
		if err, ok := err.(net.Error); ok && err.Timeout() {
			slog.Info("Slow upload... Mail the link later")
			emailHandlerUrl := fmt.Sprintf("%s/DataUploadService/%s/ResultAsEmail/send", RESTATE_URL, id)
			emailData, _ := json.Marshal(email)
			resp2, err := client.Post(emailHandlerUrl, "application/json", bytes.NewBuffer(emailData))
			if err != nil {
				return err
			}
			defer resp2.Body.Close()
			return nil
		}
		return err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	// ... process result directly ...
	slog.Info(fmt.Sprintf("Fast upload: URL was %s", string(body)))
	return nil
}

func main() {
	id := uuid.New().String()
	err := upload(id, fmt.Sprintf("%s@example.com", id))
	if err != nil {
		slog.Error("Upload failed", "err", err.Error())
		return
	}
}
