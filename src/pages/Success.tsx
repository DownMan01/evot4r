import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Success() {
  const navigate = useNavigate();

  return (
    <div className="flex justify-center items-center h-screen bg-background bg-gradient-to-br from-indigo-50 to-blue-100 px-4">
      <Card className="w-full max-w-md p-6 sm:p-8 text-center shadow-lg rounded-2xl space-y-6">
        <CardHeader>
          <div className="flex justify-center mb-3">
            <Mail className="h-12 w-12 sm:h-14 sm:w-14 text-blue-500" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-blue-700">
            Confirm Your Email
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-gray-600 text-sm sm:text-base">
            Your account has been created successfully.  
            To complete your registration, please check your inbox and click the verification link we’ve sent to your email address.
          </p>

          <p className="text-xs sm:text-sm text-gray-500">
            Didn’t receive anything? It may take a few minutes to arrive.  
            Be sure to also check your spam or junk folder.
          </p>

          <Button
            size="lg"
            className="w-full"
            onClick={() => navigate("/login")}
          >
            Return to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
