import LoginForm from "@/components/authenticate/login-form";
import { Layout } from "../../../components/layout/auth/layout";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function Login(): React.JSX.Element {
  return (
    <AuthGuard requireAuth={false} redirectTo="/dashboard">
      <Layout>
        <LoginForm />
      </Layout>
    </AuthGuard>
  );
}
