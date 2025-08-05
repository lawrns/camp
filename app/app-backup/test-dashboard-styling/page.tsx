"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Card, CardContent, CardHeader } from "@/components/unified-ui/components/Card";
import { Brain, MessageCircle, Clock, Sparkles, Users } from "lucide-react";

export default function TestDashboardStyling() {
    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Dashboard Styling Test</h1>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    <Card className="border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                        <CardContent className="spacing-6">
                            <div className="flex items-center justify-between">
                                <MessageCircle className="h-8 w-8 text-white/90" weight="duotone" />
                                <Badge className="border-0 bg-white/20 text-xs font-medium text-white">Today</Badge>
                            </div>
                            <div className="mb-2 text-3xl font-bold text-white">1,234</div>
                            <div className="text-sm font-medium text-white/90">Total Conversations</div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                        <CardContent className="spacing-6">
                            <div className="flex items-center justify-between">
                                <Clock className="h-8 w-8 text-white/90" weight="duotone" />
                                <Badge className="border-0 bg-white/20 text-xs font-medium text-white">Avg</Badge>
                            </div>
                            <div className="mb-2 text-3xl font-bold text-white">2.5m</div>
                            <div className="text-sm font-medium text-white/90">Response Time</div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                        <CardContent className="spacing-6">
                            <div className="flex items-center justify-between">
                                <Brain className="h-8 w-8 text-white/90" weight="duotone" />
                                <Badge className="border-0 bg-white/20 text-xs font-medium text-white">AI</Badge>
                            </div>
                            <div className="mb-2 text-3xl font-bold text-white">95%</div>
                            <div className="text-sm font-medium text-white/90">AI Confidence</div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                        <CardContent className="spacing-6">
                            <div className="flex items-center justify-between">
                                <Users className="h-8 w-8 text-white/90" weight="duotone" />
                                <Badge className="border-0 bg-white/20 text-xs font-medium text-white">Online</Badge>
                            </div>
                            <div className="mb-2 text-3xl font-bold text-white">12</div>
                            <div className="text-sm font-medium text-white/90">Team Members</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-200">
                        <CardHeader>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="h-2 w-2 rounded-ds-full bg-emerald-500"></div>
                                <span>Live</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-gray-900">AI Performance</span>
                                    <span className="text-sm text-gray-600">95% confidence</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-gray-900">Messages Handled</span>
                                    <span className="text-sm text-gray-600">1,234/100 daily goal</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-200">
                        <CardContent>
                            <div className="rounded-ds-xl bg-gradient-to-r from-blue-50 to-blue-100 spacing-4 border border-blue-200">
                                <div className="flex items-start gap-3">
                                    <Sparkles className="h-6 w-6 text-blue-600 flex-shrink-0" weight="fill" />
                                    <div>
                                        <h4 className="mb-2 font-semibold text-blue-900">AI Insight</h4>
                                        <p className="text-sm leading-relaxed text-blue-800">
                                            Your team is performing exceptionally well! Response times are 15% faster than last week.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="rounded-ds-xl bg-gray-50 spacing-4 text-center hover:bg-gray-100 transition-colors duration-200">
                        <div className="text-2xl font-bold text-gray-900">856</div>
                        <div className="text-xs font-medium uppercase tracking-wide text-gray-600">AI Handled</div>
                    </div>
                    <div className="rounded-ds-xl bg-gray-50 spacing-4 text-center hover:bg-gray-100 transition-colors duration-200">
                        <div className="text-2xl font-bold text-gray-900">98%</div>
                        <div className="text-xs font-medium uppercase tracking-wide text-gray-600">Satisfaction</div>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <Button
                        className="w-full bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-200"
                    >
                        View Full Dashboard
                    </Button>
                </div>
            </div>
        </div>
    );
}