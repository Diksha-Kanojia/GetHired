import { BoltIcon, ChartBarIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/20/solid'

const features = [
  {
    name: 'Real-Time Mock Interviews',
    description:
      'Practice interviews with our AI voice agent that feels just like speaking to a real recruiter.',
    icon: ChatBubbleBottomCenterTextIcon,
  },
  {
    name: 'Instant Feedback & Insights',
    description:
      'Get actionable suggestions and personalized tips right after each response to improve faster.',
    icon: BoltIcon,
  },
  {
    name: 'Performance Tracking',
    description:
      'Track your progress over time with detailed analytics and see how your confidence and skills grow.',
    icon: ChartBarIcon,
  },
]

export default function Example() {
  return (
    <div className="overflow-hidden bg-gray-950 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
          {/* Left Section - Features */}
          <div className="lg:pr-8 lg:pt-4">
            <div className="lg:max-w-lg">
              <h2 className="text-base/7 font-semibold text-indigo-400">Ace Your Interviews</h2>
              <p className="mt-2 text-pretty text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Smarter Practice. Real Results.
              </p>
              <p className="mt-6 text-lg/8 text-gray-300">
                Our AI-powered mock interview platform helps candidates build confidence, improve answers,
                and get job-ready faster than ever before.
              </p>
              <dl className="mt-10 max-w-xl space-y-8 text-base/7 text-gray-400 lg:max-w-none">
                {features.map((feature) => (
                  <div key={feature.name} className="relative pl-9">
                    <dt className="inline font-semibold text-white">
                      <feature.icon aria-hidden="true" className="absolute left-1 top-1 size-5 text-indigo-400" />
                      {feature.name}
                    </dt>{' '}
                    <dd className="inline">{feature.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* Right Section - Replaced image with tagline */}
          <div className="flex items-center justify-center text-center">
            <h1 className="text-5xl md:text-6xl font-extrabold leading-snug tracking-tight text-white">
              Get Ready.
              <br />
              Get Ahead.
              <br />
              <span className="text-indigo-400">Get Hired.</span>
            </h1>
          </div>
        </div>
      </div>
    </div>
  )
}
