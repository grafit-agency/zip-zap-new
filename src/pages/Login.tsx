import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { signIn } from "@/api/auth";


const schema = z.object({
  email: z.string().email("WRONG EMAIL"),
  password: z.string().min(6, "AT LEAST 6 CHARACTERS"),
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
          <div className="flex flex-col items-center text-center justify-center gap-8 p-16 relative max-w-[40rem] w-[100%] h-[100%] aspect-square">
          <div className="flex flex-row align-top justify-between max-h-[2.5rem] w-full max-w-[25.125rem]">
        <div className="text-[3rem] text-white relative z-20 leading-[normal]">LOGIN</div>
        <div className="flex flex-row gap-2 items-start align-top justify-start relative z-20">
          <img src="/logo.gif" alt="Grafit" className="w-auto max-h-[2.5rem] ratio-1/1" />
          <div className="flex flex-col gap-2">
          <img src="/logo.png" alt="ZipZap" className="w-auto max-h-[2.5rem] " />
          <div className="text-black">GRAPHITE INC</div>
          </div>
        </div>
        </div>
            <div className="relative z-20 w-full max-w-[25.125rem] flex flex-col gap-4">
              <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-1 flex flex-col align-top justify-start items-start">
                  <Label htmlFor="email" className="text-white uppercase text-[1.5rem] font-bold tracking-wider">Email:</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    {...register("email")} 
                    className="bg-transparent border-0 border-b-2 border-white rounded-none text-white placeholder:text-white/50 px-0 uppercase text-[2.5rem] tracking-wider focus-visible:ring-0 focus-visible:border-none focus-within:ring-0 focus-within:border-none"
                    placeholder="YOU@EXAMPLE.COM"
                  />
                  {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                </div>
                <div className="space-y-1 flex flex-col align-top justify-start items-start">
                  <Label htmlFor="password" className="text-white uppercase text-[1.5rem] font-bold tracking-wider">Password:</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    {...register("password")} 
                    className="bg-transparent border-0 border-b-2 border-white rounded-none text-white placeholder:text-white/50 px-0 text-[2.5rem] tracking-widest focus-visible:ring-0 focus-visible:border-none focus-within:ring-0 focus-within:border-none"
                  />
                  {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                </div>
              </form>
            </div>
            <div className="flex flex-row gap-[2rem] justify-between w-[100%] max-w-[25.125rem] align-start items-start relative z-20">
              <Button 
                type="submit"
                onClick={handleSubmit(onSubmit)}
                className="text-xl text-left bg-transparent text-white p-0 text-[3.125rem] leading-[normal]"
                disabled={loading}
                indicatorBlink
                indicatorColor="white"
              >
                LOG IN
              </Button>
              <Button 
                onClick={() => navigate("/register")}
                className="text-xl text-left bg-transparent text-white p-0 text-[3.125rem] leading-[normal]"
              >
                REGISTER
              </Button>
            </div>
            <img src="/assety/bg_home/bg_login_card.png" alt="Background" className="absolute top-0 left-0 w-full h-full z-10" />
          </div>
        </div>
      </div>
      <img src="/public/assety/bg_home/bg_login.png" alt="Background" className="absolute top-0 left-0 w-full h-full" />
      {/* @z-index 100 */}
    </div>
  );
};

export default Login;


