import { Layout } from "@/components/authenticate/layout";
import LoginForm from "@/components/authenticate/login-form";

export default function Page(): React.JSX.Element {
  return (
    <Layout>
      <LoginForm />
    </Layout>
  );
}
