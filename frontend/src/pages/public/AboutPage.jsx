'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Spotlight } from '../../components/ui/spotlight';
import { BorderBeam } from '../../components/ui/border-beam';
import { CardHoverEffect } from '../../components/ui/pulse-card';
import {
  Globe,
  Users,
  Heart,
  Lightbulb,
  Sparkles,
  Rocket,
  Target,
  ShieldCheck,
  Zap,
  Lock
} from 'lucide-react';
import TargetCursor from '../../components/reactbits/TargetCursor';

const iconComponents = {
  Users: Users,
  Heart: Heart,
  Lightbulb: Lightbulb,
  Globe: Globe,
  Sparkles: Sparkles,
  Rocket: Rocket,
  Target: Target,
  ShieldCheck: ShieldCheck,
  Zap: Zap,
  Lock: Lock
};

const defaultValues = [
  {
    title: 'Advanced AI',
    description:
      'Leveraging state-of-the-art neural networks to detect threats with unmatched precision and speed.',
    icon: 'Sparkles',
  },
  {
    title: 'Enterprise Security',
    description:
      'Built for scale, ensuring your data is protected with military-grade encryption and compliance standards.',
    icon: 'ShieldCheck',
  },
  {
    title: 'Real-time Analytics',
    description:
      'Instant insights and alerts, empowering your security team to respond to incidents as they happen.',
    icon: 'Zap',
  },
  {
    title: 'Global Scale',
    description:
      "Deploy across thousands of locations seamlessly, managing your entire security infrastructure from one dashboard.",
    icon: 'Globe',
  },
];

export default function AboutPage() {
  const aboutData = {
    title: 'Ob AI Sentinel',
    subtitle:
      'Redefining security surveillance with intelligent, real-time object detection.',
    mission:
      'Our mission is to empower organizations with autonomous security intelligence, transforming passive surveillance into active threat prevention.',
    vision:
      'We envision a safer world where AI seamlessly augments human capability, identifying risks before they become incidents.',
    values: defaultValues,
    className: 'relative overflow-hidden py-20',
  };

  const missionRef = useRef(null);
  const valuesRef = useRef(null);

  const missionInView = useInView(missionRef, { once: true, amount: 0.3 });
  const valuesInView = useInView(valuesRef, { once: true, amount: 0.3 });

  // Custom Purple Theme Gradients
  const themeColor = '#9D47EC';
  const purpleGradient1 = 'radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(271, 80%, 50%, 0.08) 0, hsla(271, 70%, 55%, 0.04) 50%, hsla(271, 80%, 45%, 0) 80%)';
  const purpleGradient2 = 'radial-gradient(50% 50% at 50% 50%, hsla(271, 100%, 85%, 0.08) 0, hsla(271, 100%, 55%, 0.04) 80%, transparent 100%)';
  const purpleGradient3 = 'radial-gradient(50% 50% at 50% 50%, hsla(271, 100%, 85%, 0.06) 0, hsla(271, 100%, 85%, 0.06) 80%, transparent 100%)';

  return (
    <div className="relative w-full min-h-screen bg-[#030005] text-white overflow-hidden">
      <TargetCursor
        spinDuration={2}
        hideDefaultCursor
        parallaxOn
        hoverDuration={0.2}
      />

      <section className="relative w-full overflow-hidden pt-20">
        <Spotlight
          gradientFirst={purpleGradient1}
          gradientSecond={purpleGradient2}
          gradientThird={purpleGradient3}
        />

        <div className="relative z-10 container mx-auto px-4 md:px-6">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="mx-auto mb-16 max-w-2xl text-center"
          >
            <h1 className="bg-gradient-to-r from-white via-purple-300 to-white bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl md:text-6xl">
              {aboutData.title}
            </h1>
            <p className="text-gray-400 mt-6 text-xl">
              {aboutData.subtitle}
            </p>
          </motion.div>

          {/* Mission & Vision Section */}
          <div ref={missionRef} className="relative mx-auto mb-24 max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={
                missionInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }
              }
              transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
              className="relative z-10 grid gap-12 md:grid-cols-2"
            >
              <motion.div
                whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(157, 71, 236, 0.1)' }}
                className="group border border-purple-500/20 relative block overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/10 to-transparent p-10 backdrop-blur-md"
              >
                <BorderBeam
                  duration={8}
                  size={300}
                  className="from-transparent via-purple-500/40 to-transparent"
                />

                <div className="mb-6 inline-flex aspect-square h-16 w-16 flex-1 items-center justify-center rounded-2xl bg-purple-500/10 backdrop-blur-sm border border-purple-500/20">
                  <Rocket className="text-purple-400 h-8 w-8" />
                </div>

                <div className="space-y-4">
                  <h2 className="bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-3xl font-bold text-transparent">
                    Our Mission
                  </h2>

                  <p className="text-gray-300 text-lg leading-relaxed">
                    {aboutData.mission}
                  </p>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(59, 130, 246, 0.1)' }}
                className="group border border-blue-500/20 relative block overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900/10 to-transparent p-10 backdrop-blur-md"
              >
                <BorderBeam
                  duration={8}
                  size={300}
                  className="from-transparent via-blue-500/40 to-transparent"
                  reverse
                />
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 backdrop-blur-sm border border-blue-500/20">
                  <Target className="h-8 w-8 text-blue-400" />
                </div>

                <h2 className="mb-4 bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-3xl font-bold text-transparent">
                  Our Vision
                </h2>

                <p className="text-gray-300 text-lg leading-relaxed">
                  {aboutData.vision}
                </p>
              </motion.div>
            </motion.div>
          </div>

          <div ref={valuesRef} className="mb-24 px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={
                valuesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
              }
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="mb-12 text-center"
            >
              <h2 className="bg-gradient-to-r from-white via-purple-300 to-white bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
                Core Capabilities
              </h2>
              <p className="text-gray-400 mx-auto mt-4 max-w-2xl text-lg">
                Technological pillars that define our security architecture.
              </p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {aboutData.values?.map((value, index) => {
                const IconComponent = iconComponents[value.icon];

                return (
                  <motion.div
                    key={value.title}
                    initial={{ opacity: 0, y: 30 }}
                    animate={
                      valuesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
                    }
                    transition={{
                      duration: 0.6,
                      delay: index * 0.1 + 0.2,
                      ease: 'easeOut',
                    }}
                    whileHover={{ y: -5, scale: 1.02 }}
                  >
                    <CardHoverEffect
                      icon={<IconComponent className="h-6 w-6" />}
                      title={value.title}
                      description={value.description}
                      variant={
                        index === 0
                          ? 'purple'
                          : index === 1
                            ? 'blue'
                            : index === 2
                              ? 'amber'
                              : 'rose'
                      }
                      glowEffect={true}
                      size="lg"
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
