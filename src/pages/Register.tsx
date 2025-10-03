import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { signUp } from "@/api/auth";

const schema = z.object({
  full_name: z.string().min(1, "Podaj imię i nazwisko"),
  email: z.string().email("Nieprawidłowy email"),
  password: z.string().min(6, "Min. 6 znaków"),
});

type FormValues = z.infer<typeof schema>;

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);
      await signUp(values.email, values.password, values.full_name);
      toast({ title: "Konto utworzone", description: "Możesz się zalogować" });
      navigate("/login");
    } catch (e: any) {
      toast({ title: "Błąd rejestracji", description: e.message ?? "Spróbuj ponownie" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Rejestracja</CardTitle>
          <CardDescription>Utwórz nowe konto gracza</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="full_name">Imię i nazwisko</Label>
              <Input id="full_name" {...register("full_name")} />
              {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Hasło</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Rejestrowanie..." : "Zarejestruj się"}
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            Masz już konto? <Link to="/login" className="text-primary underline">Zaloguj się</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;


