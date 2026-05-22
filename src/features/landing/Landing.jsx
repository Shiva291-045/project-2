import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button, Container, Card, Badge, GlassCard } from "../../components/ui";
import {
  Brain,
  Zap,
  BarChart3,
  Users,
  CheckCircle,
  Star,
  ArrowRight,
  Menu,
  X,
} from "lucide-react";
import { useTheme } from "../../ThemeContext";

export const Landing = () => {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  const features = [
    {
      icon: Brain,
      title: "AI Interview Coach",
      description: "Get real-time feedback from our advanced AI-powered interviewer",
    },
    {
      icon: Zap,
      title: "Instant Feedback",
      description: "Receive detailed feedback on your technical and communication skills",
    },
    {
      icon: BarChart3,
      title: "Progress Analytics",
      description: "Track your improvement with comprehensive analytics and insights",
    },
    {
      icon: Users,
      title: "Community Leaderboard",
      description: "Compete with other candidates and earn achievement badges",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Software Engineer at Google",
      content:
        "PrepAI's AI coach helped me crack my interviews. The feedback is incredibly accurate and actionable.",
      rating: 5,
    },
    {
      name: "Marcus Johnson",
      role: "Product Manager at Microsoft",
      content:
        "The most realistic interview practice I've experienced. Felt exactly like a real interview.",
      rating: 5,
    },
    {
      name: "Priya Patel",
      role: "Data Scientist at Meta",
      content:
        "The analytics dashboard helped me identify my weak areas. Highly recommend for anyone preparing for interviews!",
      rating: 5,
    },
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "$29",
      period: "/month",
      description: "Perfect for getting started",
      features: [
        "5 AI interviews per month",
        "Basic analytics",
        "Community access",
        "Email support",
      ],
    },
    {
      name: "Pro",
      price: "$79",
      period: "/month",
      description: "Most popular plan",
      featured: true,
      features: [
        "Unlimited AI interviews",
        "Advanced analytics",
        "Resume analyzer",
        "Coding practice with 500+ problems",
        "Priority support",
      ],
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact us",
      description: "For teams and organizations",
      features: [
        "Everything in Pro",
        "Custom training programs",
        "Team management",
        "API access",
        "Dedicated support",
      ],
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-900">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <Container className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">P</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
              PrepAI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 transition-colors">
              Pricing
            </a>
            <a href="#testimonials" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 transition-colors">
              Testimonials
            </a>
          </nav>

          {/* Right Section */}
          <div className="hidden md:flex items-center space-x-4">
            <button onClick={toggleTheme} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>

          {/* Mobile Menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </Container>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-800 p-4">
            <nav className="space-y-4">
              <a href="#features" className="block text-gray-700 dark:text-gray-300 hover:text-purple-600">
                Features
              </a>
              <a href="#pricing" className="block text-gray-700 dark:text-gray-300 hover:text-purple-600">
                Pricing
              </a>
              <a href="#testimonials" className="block text-gray-700 dark:text-gray-300 hover:text-purple-600">
                Testimonials
              </a>
              <Link to="/login">
                <Button variant="ghost" className="w-full justify-center">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button className="w-full justify-center">Get Started</Button>
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-20 right-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl" />
        </div>

        <Container className="relative z-10">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div variants={fadeIn}>
              <Badge variant="primary" className="mb-4 inline-block">
                🚀 Launch Your Interview Success
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeIn}
              className="text-5xl lg:text-7xl font-bold mb-6 text-gray-900 dark:text-white"
            >
              Your AI-Powered{" "}
              <span className="bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                Interview Coach
              </span>
            </motion.h1>

            <motion.p
              variants={fadeIn}
              className="text-xl text-gray-600 dark:text-gray-400 mb-8"
            >
              Practice with AI, get instant feedback, and crack your dream tech interview. Join 10,000+ candidates
              already preparing with PrepAI.
            </motion.p>

            <motion.div variants={fadeIn} className="flex gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" variant="gradient" className="flex items-center space-x-2">
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="secondary">
                  Sign In
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </Container>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50 dark:bg-gray-800/50">
        <Container>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={fadeIn} className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Why Choose PrepAI?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Everything you need to ace your interviews
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div key={index} variants={fadeIn}>
                    <Card className="h-full">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-lg flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </Container>
      </section>

      {/* Statistics Section */}
      <section className="py-20">
        <Container>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8 text-center"
          >
            <motion.div variants={fadeIn}>
              <h3 className="text-4xl lg:text-5xl font-bold text-purple-600 mb-2">10K+</h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg">Active Users</p>
            </motion.div>
            <motion.div variants={fadeIn}>
              <h3 className="text-4xl lg:text-5xl font-bold text-cyan-600 mb-2">500K+</h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg">Interviews Conducted</p>
            </motion.div>
            <motion.div variants={fadeIn}>
              <h3 className="text-4xl lg:text-5xl font-bold text-green-600 mb-2">95%</h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg">Success Rate</p>
            </motion.div>
          </motion.div>
        </Container>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gray-50 dark:bg-gray-800/50">
        <Container>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={fadeIn} className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Loved by Candidates
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Join thousands of successful interview candidates
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <motion.div key={index} variants={fadeIn}>
                  <GlassCard>
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-5 h-5 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                    <p className="text-gray-900 dark:text-white mb-4 italic">
                      "{testimonial.content}"
                    </p>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {testimonial.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {testimonial.role}
                      </p>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </Container>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <Container>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={fadeIn} className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Choose the plan that's right for you
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {pricingPlans.map((plan, index) => (
                <motion.div key={index} variants={fadeIn}>
                  <Card
                    className={`relative h-full ${
                      plan.featured
                        ? "ring-2 ring-purple-600 lg:scale-105"
                        : ""
                    }`}
                  >
                    {plan.featured && (
                      <Badge variant="primary" className="absolute -top-4 left-1/2 -translate-x-1/2">
                        Most Popular
                      </Badge>
                    )}

                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      {plan.description}
                    </p>

                    <div className="mb-6">
                      <span className="text-5xl font-bold text-gray-900 dark:text-white">
                        {plan.price}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {plan.period}
                      </span>
                    </div>

                    <Button
                      className="w-full mb-6"
                      variant={plan.featured ? "gradient" : "secondary"}
                    >
                      Get Started
                    </Button>

                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-gray-700 dark:text-gray-300">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-cyan-600">
        <Container>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center"
          >
            <motion.h2
              variants={fadeIn}
              className="text-4xl lg:text-5xl font-bold text-white mb-6"
            >
              Ready to Ace Your Interviews?
            </motion.h2>
            <motion.p
              variants={fadeIn}
              className="text-xl text-white/90 mb-8"
            >
              Start your free trial today. No credit card required.
            </motion.p>
            <motion.div variants={fadeIn}>
              <Link to="/register">
                <Button
                  size="lg"
                  className="bg-white text-purple-600 hover:bg-gray-50 font-semibold"
                >
                  Start Free Trial
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <Container>
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">P</span>
                </div>
                <span className="text-lg font-bold text-white">PrepAI</span>
              </div>
              <p className="text-sm">Your AI-powered interview coach.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center text-sm">
            <p>&copy; 2024 PrepAI. All rights reserved.</p>
          </div>
        </Container>
      </footer>
    </div>
  );
};
