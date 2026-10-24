import RegisterForm from "@/components/RegisterForm";
import AnimeFigure from "@/components/AnimeFigure";

const Register = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 flex">
        <div className="w-full md:w-1/2 flex items-center justify-center px-6 py-12 md:py-16">
          <RegisterForm />
        </div>
        {/* Right: 3D Figure (desktop only) */}
        <div className="hidden md:flex md:w-1/2 items-center justify-center relative overflow-hidden">
          <AnimeFigure />
        </div>
      </main>
    </div>
  );
};

export default Register;
