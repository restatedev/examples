"use client";
import * as restate from "@restatedev/restate-sdk-clients";
import type { Greeter } from "@/restate/services/greeter";
import { GREETER_SERVICE } from "@/restate/services/constants";
import Form from "next/form";
import { Badge } from "@/components/Badge";
import { Input } from "@/components/Input";
import { SubmitButton } from "@/components/SubmitButton";
import { PropsWithChildren, useState } from "react";
import { useFormStatus } from "react-dom";


const rs = restate.connect({ url: "http://localhost:8080" });
const greeterClient = rs.serviceClient<Greeter>(
    GREETER_SERVICE
);

export default function Home() {
  const [greetAnswer, setGreetAnswer] = useState<string | null>(null);

  const formAction = async (formData: FormData) => {
    const name = String(formData.get("name"));
    if (name) {
      const response = await greeterClient.greet(name);
      setGreetAnswer(response);
    }
  };

  return (
      <section className="flex space-x-4 flex-col items-center justify-center min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]">
          <Form action={formAction} className="flex flex-col gap-4">
            <Input
                type="text"
                name="name"
                required
                placeholder="Enter a name"
                label="Name"
            />
              <div className="font-medium text-sm">
                <Response>{greetAnswer}</Response>
              </div>
            <SubmitButton>Greet</SubmitButton>
          </Form>
      </section>
  );
}

function Response({children}: PropsWithChildren) {
  const {pending, } = useFormStatus();

  if (!pending && !children) {
    return null
  }

  return <>Response: <Badge>{pending ? "…" : children}</Badge></>
}
