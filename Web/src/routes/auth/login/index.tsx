import React, { useEffect } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Activity,
  Cpu,
  Eye,
  EyeOff,
  Heart,
  Shield,
  Wifi,
  Info,
} from "lucide-react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useUserStore } from "@/store/user-store.ts";

export const Route = createFileRoute("/auth/login/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const setUserInfo = useUserStore((state) => state.setUserInfo);

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const access_token = localStorage.getItem("access_token");
    if (access_token) {
      const decoded = jwtDecode(access_token);

      const userInfo = JSON.parse(decoded.sub as string);
      setUserInfo({
        id: userInfo.id,
        username: userInfo.username,
      });

      navigate({ to: "/home" });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      setIsLoading(true);

      const newErrors: Record<string, string> = {};

      if (!loginForm.username.trim()) {
        newErrors.username = "用户名不能为空";
      }
      if (!loginForm.password) {
        newErrors.password = "密码不能为空";
      }

      setErrors(newErrors);

      if (Object.keys(newErrors).length === 0) {
        const response = await axios.post(
          `http://123.60.80.170:9988/api/auth/login`,
          loginForm,
        );

        if (response.data.status === "success") {
          const access_token = response.data.data;

          const decoded = jwtDecode(access_token);
          const userInfo = JSON.parse(decoded.sub as string);

          localStorage.setItem("access_token", access_token);

          setUserInfo({
            id: userInfo.id,
            username: userInfo.username,
          });

          toast.success("登录成功！欢迎回来。");
          setLoginForm({ username: "", password: "" });
          navigate({
            to: "/home",
          });
        } else {
          toast.error("账号或密码错误，请重试。");
        }
      }
    } catch (err: unknown) {
      toast.error("服务器内部错误，请稍后再试。");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* 科技感背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=60 height=60 viewBox=0 0 60 60 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=none fillRule=evenodd%3E%3Cg fill=%23e0e7ff fillOpacity=0.3%3E%3Ccircle cx=30 cy=30 r=1/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
      </div>

      {/* 浮动装饰元素 */}
      <div className="absolute top-20 left-20 w-20 h-20 bg-blue-200/30 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-32 h-32 bg-purple-200/30 rounded-full blur-xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-10 w-16 h-16 bg-indigo-200/30 rounded-full blur-xl animate-pulse delay-500"></div>

      <div className="w-full max-w-md relative z-10 p-4">
        {/* 头部品牌区域 */}
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
            {/* 主图标背景 */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-lg"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-3xl shadow-inner opacity-80"></div>

            {/* 图标组合 */}
            <div className="relative flex items-center justify-center">
              <Heart className="h-6 w-6 text-white absolute -top-1 -left-1" />
              <Shield className="h-8 w-8 text-white z-10" />
              <Activity className="h-4 w-4 text-white absolute bottom-0 right-0" />
            </div>

            {/* 脉冲效果 */}
            <div className="absolute inset-0 rounded-3xl bg-blue-400 animate-ping opacity-20"></div>
          </div>

          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
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
              欢迎回来
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              登录您的监护管理账户
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
                  value={loginForm.username}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, username: e.target.value })
                  }
                  className={`h-11 transition-all duration-200 ${
                    errors.username
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-200"
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
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm({ ...loginForm, password: e.target.value })
                    }
                    className={`h-11 pr-11 transition-all duration-200 ${
                      errors.password
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-200 focus:border-blue-500 focus:ring-blue-200"
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
                {errors.password && (
                  <Alert variant="destructive" className="py-2">
                    <AlertDescription className="text-sm">
                      {errors.password}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    登录中...
                  </div>
                ) : (
                  "登录系统"
                )}
              </Button>
            </form>

            <div className="space-y-4">
              {/* New "Learn More" Button */}
              <div className="text-center">
                <Link to="/welcome">
                  <Button
                    variant="link"
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Info className="mr-1 h-4 w-4" />
                    了解我们的产品
                  </Button>
                </Link>
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
                  还没有账户？
                </span>
                <Link to="/auth/register">
                  <Button
                    variant="link"
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    立即注册
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
