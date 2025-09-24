"use client";
import Form from "next/form";

import { useActionState } from "react";
import { greetAction } from "./actions";

export default function Home() {
  const [state, formAction, pending] = useActionState(greetAction, null);

  return (
    <section>
      <Form action={formAction}>
        <div>
          <label>
            Name
            <input
              type="text"
              name="name"
              required
              placeholder="Enter a name"
            />
          </label>
        </div>
        <div>
          <button type="submit" disabled={pending}>
            Greet
            {pending && "…"}
          </button>
        </div>
      </Form>
      <output>
        Response: <code>{pending ? "…" : state?.message}</code>
      </output>
    </section>
  );
}