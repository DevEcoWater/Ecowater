import { Layout } from "@/components/authenticate/layout";
import RegisterForm from "@/components/authenticate/register-form";

export default function Page(): React.JSX.Element {
  return (
    <Layout>
      <RegisterForm />
    </Layout>
  );
}
