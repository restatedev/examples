"use server";

import * as restate from "@restatedev/restate-sdk-clients";
import type { Greeter } from "@/restate/greeter";

export type GreetActionState = {
  type: 'success';
  message: string;
} | {
  type: 'error';
  message: string;
} | null;

// Action running in the server to execute requests to Restate Cloud
export async function greetAction(prevState: GreetActionState, formData: FormData): Promise<GreetActionState> {
  const name = String(formData.get("name"));
  if (!name) {
    return prevState;
  }

  try {
    // Determine the Restate URL
    let restateUrl = getRestateUrl();
    // Determine the auth headers
    let restateHeaders = getRestateAuthHeaders();

    // Setup the Restate client
    const rs = restate.connect({
      url: restateUrl,
      headers: restateHeaders
    });
    // Create a client for the Greeter service
    const greeterClient = rs.serviceClient<Greeter>({ name: "Greeter" });

    // Execute the request
    const response = await greeterClient.greet({ name });
    return {
      type: 'success',
      message: response.result
    };
  } catch (error) {
    return {
      type: 'error',
      message: (error as Error).message
    };
  }
}

function getRestateUrl(): string {
  if (process.env.VERCEL) {
    // We're running on Vercel, the RESTATE_URL should be set
    if (!process.env.RESTATE_URL) {
      throw new Error('RESTATE_URL environment variable is not set');
    }
    return process.env.RESTATE_URL;
  } else {
    return "http://localhost:8080"; // Local Restate instance
  }
}

function getRestateAuthHeaders(): Record<string, string> {
  if (process.env.VERCEL) {
    const apiKey = process.env.RESTATE_API_KEY;
    if (!apiKey) {
      throw new Error('RESTATE_API_KEY environment variable is not set');
    }
    return {
      Authorization: "Bearer " + apiKey,
    };
  } else {
    // No need for authorization when testing locally
    return {};
  }
}