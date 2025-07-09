import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import { UserRoundX, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/welcome/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Back to Login Button */}
      <div className="mb-4">
        <Link to="/auth/login">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回登录
          </Button>
        </Link>
      </div>
      {/* 欢迎横幅 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg p-8 mb-8 text-white shadow-lg">
        <h1 className="text-4xl font-bold mb-4">多模态养老看护监测系统</h1>
        <h2 className="text-2xl mb-6">基于PSoC6开发板：CY8CPROTO-062-4343W</h2>
        <p className="text-lg max-w-3xl">
          欢迎使用我们的多模态养老看护监测系统，该系统利用先进的传感技术和人工智能，为用户提供全方位的健康监护和智能辅助功能。
        </p>
      </div>

      {/* 系统概述 */}
      <div className="mb-12">
        {/*<h2 className="text-3xl font-bold mb-6 text-center">系统概述</h2>*/}
        <p className="text-lg text-center max-w-4xl mx-auto mb-8">
          我们的系统基于PSoC6开发板，集成了毫米波雷达、语音识别、触摸感应等多种技术，为用户提供生理监控、智能分析、语音呼救和轮椅智控等功能。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 功能卡片 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-2 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                生理监控
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p>
                利用毫米波雷达技术，无接触监测用户的心率、呼吸率等生理指标，实时掌握健康状况。
              </p>
            </CardContent>
            {/*<CardFooter>*/}
            {/*  <Link to="/physiological">*/}
            {/*    <Button variant="outline">了解更多</Button>*/}
            {/*  </Link>*/}
            {/*</CardFooter>*/}
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-2 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                智能分析
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p>
                结合大型语言模型(LLM)技术，对采集的生理数据进行智能分析，提供健康建议和异常预警。
              </p>
            </CardContent>
            {/*<CardFooter>*/}
            {/*  <Link to="/intelligent">*/}
            {/*    <Button variant="outline">了解更多</Button>*/}
            {/*  </Link>*/}
            {/*</CardFooter>*/}
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="bg-red-50">
              <CardTitle className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-2 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.728-2.728"
                  />
                </svg>
                语音呼救
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p>
                通过开发板的录音模块，实现语音识别和紧急呼救功能，在危急情况下及时获取帮助。
              </p>
            </CardContent>
            {/*<CardFooter>*/}
            {/*  <Link to="/emergency">*/}
            {/*    <Button variant="outline">了解更多</Button>*/}
            {/*  </Link>*/}
            {/*</CardFooter>*/}
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="bg-purple-50">
              <CardTitle className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-2 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                轮椅智控
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p>
                利用Capsense触摸感应模块，实现轮椅的智能控制，提高行动不便用户的生活质量。
              </p>
            </CardContent>
            {/*<CardFooter>*/}
            {/*  <Link to="/wheelchair">*/}
            {/*    <Button variant="outline">了解更多</Button>*/}
            {/*  </Link>*/}
            {/*</CardFooter>*/}
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="bg-orange-50">
              <CardTitle className="flex items-center">
                <UserRoundX className="h-6 w-6 mr-2 text-orange-600" />
                摔倒检测
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p>
                利用摄像头和大模型实时检测分析摔倒情况，为用户安全提供及时警报，全方位守护您的安全。
              </p>
            </CardContent>
            {/*<CardFooter>*/}
            {/*  <Link to="/fall-detection">*/}
            {/*    <Button variant="outline">了解更多</Button>*/}
            {/*  </Link>*/}
            {/*</CardFooter>*/}
          </Card>
        </div>
      </div>

      <Separator className="my-8" />

      {/* 技术原理 */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold mb-6 text-center">技术原理</h2>
        <Tabs defaultValue="radar" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="radar">毫米波雷达</TabsTrigger>
            <TabsTrigger value="llm">LLM智能分析</TabsTrigger>
            <TabsTrigger value="voice">语音识别</TabsTrigger>
            <TabsTrigger value="capsense">Capsense触控</TabsTrigger>
          </TabsList>
          <TabsContent value="radar" className="p-6 bg-gray-50 rounded-lg mt-4">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-2/3">
                <h3 className="text-xl font-bold mb-3">毫米波雷达技术</h3>
                <p className="mb-4">
                  PSoC6开发板集成的毫米波雷达可以通过发射电磁波并接收反射信号，精确检测人体微小的生理活动。
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>无接触测量：无需佩戴设备，保护用户隐私</li>
                  <li>高精度检测：可捕捉微小的胸腔运动和心脏搏动</li>
                  <li>全天候监测：不受光线和温度影响，可全天候工作</li>
                  <li>多参数采集：同时监测心率、呼吸率等多项生理指标</li>
                </ul>
              </div>
              <div className="md:w-1/3 flex items-center justify-center">
                <div className="w-48 h-48 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-24 w-24 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="llm" className="p-6 bg-gray-50 rounded-lg mt-4">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-2/3">
                <h3 className="text-xl font-bold mb-3">
                  大型语言模型(LLM)智能分析
                </h3>
                <p className="mb-4">
                  系统集成了先进的大型语言模型，对采集的生理数据进行深度分析和解读。
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>数据解读：将复杂的生理数据转化为易于理解的健康信息</li>
                  <li>趋势分析：识别长期健康趋势和潜在风险</li>
                  <li>个性化建议：根据用户的健康状况提供定制化的健康建议</li>
                  <li>异常预警：及时发现异常情况并发出预警</li>
                </ul>
              </div>
              <div className="md:w-1/3 flex items-center justify-center">
                <div className="w-48 h-48 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-24 w-24 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="voice" className="p-6 bg-gray-50 rounded-lg mt-4">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-2/3">
                <h3 className="text-xl font-bold mb-3">语音识别技术</h3>
                <p className="mb-4">
                  PSoC6开发板的录音模块结合语音识别算法，实现了强大的语音交互和呼救功能。
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>关键词识别：识别特定的呼救关键词，触发紧急响应</li>
                  <li>情绪分析：通过语音情绪分析，判断用户的紧急程度</li>
                  <li>语音指令：支持多种语音指令，方便行动不便的用户</li>
                  <li>自动拨号：紧急情况下自动拨打预设的紧急联系人</li>
                </ul>
              </div>
              <div className="md:w-1/3 flex items-center justify-center">
                <div className="w-48 h-48 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-24 w-24 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent
            value="capsense"
            className="p-6 bg-gray-50 rounded-lg mt-4"
          >
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-2/3">
                <h3 className="text-xl font-bold mb-3">Capsense触控技术</h3>
                <p className="mb-4">
                  PSoC6开发板的Capsense模块提供了高灵敏度的触摸感应功能，为轮椅智能控制提供了便捷的交互方式。
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>多点触控：支持多点触控，实现复杂的控制指令</li>
                  <li>手势识别：识别滑动、点击等手势，简化操作</li>
                  <li>防误触设计：智能识别有效触控，避免误操作</li>
                  <li>低功耗：采用低功耗设计，延长设备使用时间</li>
                </ul>
              </div>
              <div className="md:w-1/3 flex items-center justify-center">
                <div className="w-48 h-48 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-24 w-24 text-purple-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
