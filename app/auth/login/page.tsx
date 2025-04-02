import LoginForm from "@/components/authenticate/login-form";
import { Layout } from "../../../components/layout/auth/layout";
import { ProtectedRoutesWIthSession } from "@/app/dashboard/session";

export default function Login(): React.JSX.Element {
  return (
    <ProtectedRoutesWIthSession>
      <Layout>
        <LoginForm />
      </Layout>
    </ProtectedRoutesWIthSession>
  );
}
