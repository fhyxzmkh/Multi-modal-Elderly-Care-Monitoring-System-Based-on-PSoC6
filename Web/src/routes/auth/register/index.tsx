import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Activity,
  CheckCircle,
  Cpu,
  Eye,
  EyeOff,
  Heart,
  Shield,
  Wifi,
} from "lucide-react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import axios from "axios";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/register/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      setIsLoading(true);

      const newErrors: Record<string, string> = {};

      if (!registerForm.username.trim()) {
        newErrors.username = "用户名不能为空";
      } else if (registerForm.username.length < 3) {
        newErrors.username = "用户名至少需要3个字符";
      }

      if (!registerForm.password) {
        newErrors.password = "密码不能为空";
      } else if (registerForm.password.length < 6) {
        newErrors.password = "密码至少需要6个字符";
      }

      if (!registerForm.confirmPassword) {
        newErrors.confirmPassword = "请确认密码";
      } else if (registerForm.password !== registerForm.confirmPassword) {
        newErrors.confirmPassword = "两次输入的密码不一致";
      }

      setErrors(newErrors);

      if (Object.keys(newErrors).length === 0) {
        const response = await axios.post(
          `http://123.60.80.170:9988/api/auth/register`,
          registerForm,
        );

        if (response.data.status === "success") {
          toast.success("注册成功！请登录。");
          setRegisterForm({ username: "", password: "", confirmPassword: "" });
          navigate({
            to: "/auth/login",
          });
        } else {
          toast.error(response.data.message);
        }
      }
    } catch (err: unknown) {
      toast.error("服务器内部错误，请稍后再试。");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, text: "", color: "" };
    if (password.length < 6)
      return { strength: 1, text: "弱", color: "text-red-500" };
    if (password.length < 8)
      return { strength: 2, text: "中等", color: "text-yellow-500" };
    return { strength: 3, text: "强", color: "text-green-500" };
  };

  const passwordStrength = getPasswordStrength(registerForm.password);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* 科技感背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=60 height=60 viewBox=0 0 60 60 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=none fillRule=evenodd%3E%3Cg fill=%23dcfce7 fillOpacity=0.3%3E%3Ccircle cx=30 cy=30 r=1/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
      </div>

      {/* 浮动装饰元素 */}
      <div className="absolute top-20 right-20 w-24 h-24 bg-emerald-200/30 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 left-20 w-28 h-28 bg-blue-200/30 rounded-full blur-xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 right-10 w-16 h-16 bg-indigo-200/30 rounded-full blur-xl animate-pulse delay-500"></div>

      <div className="w-full max-w-md relative z-10 p-4">
        {/* 头部品牌区域 */}
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
            {/* 主图标背景 */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-3xl shadow-lg"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-3xl shadow-inner opacity-80"></div>

            {/* 图标组合 */}
            <div className="relative flex items-center justify-center">
              <Heart className="h-6 w-6 text-white absolute -top-1 -left-1" />
              <Shield className="h-8 w-8 text-white z-10" />
              <Activity className="h-4 w-4 text-white absolute bottom-0 right-0" />
            </div>

            {/* 脉冲效果 */}
            <div className="absolute inset-0 rounded-3xl bg-emerald-400 animate-ping opacity-20"></div>
          </div>

          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-2">
            多模态养老看护监测系统
          </h1>
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <Cpu className="h-4 w-4" />
            开启智能AIoT守护之旅
            <Wifi className="h-4 w-4" />
          </p>
        </div>

        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/80">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-semibold text-gray-800">
              创建账户
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              加入智能监护管理平台
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  用户名
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="请输入用户名"
                  value={registerForm.username}
                  onChange={(e) =>
                    setRegisterForm({
                      ...registerForm,
                      username: e.target.value,
                    })
                  }
                  className={`h-11 transition-all duration-200 ${
                    errors.username
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                      : "border-gray-200 focus:border-emerald-500 focus:ring-emerald-200"
                  }`}
                />
                {errors.username && (
                  <Alert variant="destructive" className="py-2">
                    <AlertDescription className="text-sm">
                      {errors.username}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  密码
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="请输入密码"
                    value={registerForm.password}
                    onChange={(e) =>
                      setRegisterForm({
                        ...registerForm,
                        password: e.target.value,
                      })
                    }
                    className={`h-11 pr-11 transition-all duration-200 ${
                      errors.password
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-200 focus:border-emerald-500 focus:ring-emerald-200"
                    }`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>

                {/* 密码强度指示器 */}
                {registerForm.password && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            level <= passwordStrength.strength
                              ? level === 1
                                ? "bg-red-400"
                                : level === 2
                                  ? "bg-yellow-400"
                                  : "bg-green-400"
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span
                      className={`text-xs font-medium ${passwordStrength.color}`}
                    >
                      {passwordStrength.text}
                    </span>
                  </div>
                )}

                {errors.password && (
                  <Alert variant="destructive" className="py-2">
                    <AlertDescription className="text-sm">
                      {errors.password}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirm-password"
                  className="text-sm font-medium"
                >
                  确认密码
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="请再次输入密码"
                    value={registerForm.confirmPassword}
                    onChange={(e) =>
                      setRegisterForm({
                        ...registerForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    className={`h-11 pr-11 transition-all duration-200 ${
                      errors.confirmPassword
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-200 focus:border-emerald-500 focus:ring-emerald-200"
                    }`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>

                {/* 密码匹配指示器 */}
                {registerForm.confirmPassword && registerForm.password && (
                  <div className="flex items-center gap-2 mt-2">
                    {registerForm.password === registerForm.confirmPassword ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        <span className="text-xs">密码匹配</span>
                      </div>
                    ) : (
                      <span className="text-xs text-red-500">密码不匹配</span>
                    )}
                  </div>
                )}

                {errors.confirmPassword && (
                  <Alert variant="destructive" className="py-2">
                    <AlertDescription className="text-sm">
                      {errors.confirmPassword}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    注册中...
                  </div>
                ) : (
                  "创建账户"
                )}
              </Button>
            </form>

            <div className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                注册即表示你同意我们的
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm text-emerald-600 hover:text-emerald-700"
                >
                  服务条款
                </Button>
                和
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm text-emerald-600 hover:text-emerald-700"
                >
                  隐私政策
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-muted-foreground font-medium">
                    或者
                  </span>
                </div>
              </div>

              <div className="text-center">
                <span className="text-sm text-muted-foreground">
                  已有账户？
                </span>
                <Link to="/auth/login">
                  <Button
                    variant="link"
                    className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    立即登录
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8 text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-4 w-4" />
            <span>安全可靠的智能监护平台</span>
          </div>
          © 2025 保留所有权利.
        </div>
      </div>
    </div>
  );
}
