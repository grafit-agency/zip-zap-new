import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { signIn } from "@/api/auth";


const schema = z.object({
  email: z.string().email("Nieprawidłowy email"),
  password: z.string().min(6, "Min. 6 znaków"),
});

type FormValues = z.infer<typeof schema>;

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);
      await signIn(values.email, values.password);
      toast({ title: "Zalogowano", description: "Witaj ponownie!" });
      navigate("/game");
    } catch (e: any) {
      toast({ title: "Błąd logowania", description: e.message ?? "Spróbuj ponownie" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative">
      <div className="container max-w-4xl mx-auto w-full">
        <div className="flex flex-col items-center gap-8">
          <div className="flex flex-col items-center text-center justify-center gap-8 relative max-w-[31.25rem] w-[100%] h-[100%] aspect-square">
          <div className="flex flex-row align-top justify-between max-h-[2.5rem] w-full max-w-[25.125rem]">
        <div className="text-[3rem] text-white relative z-20 leading-[normal]">LEADERBOARD</div>
        <div className="flex flex-row gap-2 items-start align-top justify-start relative z-20">
          <img src="/logo.gif" alt="Grafit" className="w-auto max-h-[2.5rem] ratio-1/1" />
          <div className="flex flex-col gap-2">
          <img src="/logo.png" alt="ZipZap" className="w-auto max-h-[2.5rem] " />
          <div className="text-black">GRAPHITE INC</div>
          </div>
        </div>
        </div>
            <div className="relative z-20 w-full max-w-[25.125rem] mix-blend-difference flex flex-col gap-4">
              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
                  {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Hasło</Label>
                  <Input id="password" type="password" {...register("password")} />
                  {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Logowanie..." : "Zaloguj się"}
                </Button>
              </form>
              <p className="mt-2 text-sm text-white">
                Nie masz konta? <Link to="/register" className="text-white underline">Zarejestruj się</Link>
              </p>
            </div>
            <div className="flex flex-col gap-[0.625rem] justify-start align-start items-start relative z-20">
              <Button 
                onClick={() => navigate("/")}
                className="text-xl text-left bg-transparent text-white p-0 text-[3.125rem] leading-[normal]"
              >
                BACK
              </Button>
            </div>
            <img src="/assety/bg_home/bg_home_card.png" alt="Background" className="absolute top-0 left-0 w-full h-full z-10" />
          </div>
        </div>
      </div>
      <img src="/assety/bg_home/bg_home1.png" alt="Background" className="absolute top-0 left-0 w-full h-full" />
    </div>
  );
};

export default Login;


