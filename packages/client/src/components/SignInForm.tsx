import { Button } from "@/components/ui/button"
import {
  Field,
  FieldLabel,
  FieldDescription
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
export function SignInForm() {

  const onSubmit = (e: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    e.preventDefault();
  }
  return (
    <div 
    className="w-full max-w-md bg-cover bg-center p-10 rounded-lg shadow-lg " 
    >
        <h1 className="text-4xl text-center pb-10">Sign In</h1>
      <form onSubmit={onSubmit}>
        <Field>
            <FieldLabel className="text-md" htmlFor="input-field-email">Email</FieldLabel>
            <Input
                id="input-field-email"
                type="email"
                placeholder="Enter your email"
            />
        </Field>
        <Field className="pt-10">
            <FieldLabel className="text-md" htmlFor="input-field-password">Password</FieldLabel>
            <Input
                id="input-field-password"
                type="password"
                placeholder="Enter your password"
            />
            <FieldDescription>
              Password must be at least 9 characters.
            </FieldDescription>
        </Field>
        <Field className="pt-10" orientation={"vertical"}>
            <Button className="cursor-pointer" type="submit">
                    Sign In 
            </Button>
        </Field>
      </form>
    </div>
  )
}
