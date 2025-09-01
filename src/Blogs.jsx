const stories = [
  {
    id: 1,
    title: 'Real Placement Experience',
    href: '#',
    description:
      "I used this platform for mock interviews, and honestly, it felt just like a real placement round. The feedback was detailed, and I realized exactly where I was going wrong.",
    date: 'Apr 12, 2025',
    datetime: '2025-04-12',
    category: { title: 'Interview Prep', href: '#' },
    author: {
      name: 'Aarav Sharma',
      role: 'Final-year CS student',
      href: '#',
      imageUrl: 'https://randomuser.me/api/portraits/men/51.jpg',
    },
  },
  {
    id: 2,
    title: 'Boosted Confidence',
    href: '#',
    description:
      "Practicing mock interviews here really boosted my confidence. I wasn't just answering questions, I was learning how to explain my thought process better.",
    date: 'May 3, 2025',
    datetime: '2025-05-03',
    category: { title: 'Growth', href: '#' },
    author: {
      name: 'Neha Verma',
      role: 'Aspiring Software Engineer',
      href: '#',
      imageUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
    },
  },
  {
    id: 3,
    title: 'Prepared for Success',
    href: '#',
    description:
      "Before using this, I used to blank out in interviews. After a few mocks, I could handle technical and HR questions much more smoothly. This platform prepared me better than I expected.",
    date: 'Jun 15, 2025',
    datetime: '2025-06-15',
    category: { title: 'Career Journey', href: '#' },
    author: {
      name: 'Rohan Gupta',
      role: 'Job Seeker, Full-Stack Developer',
      href: '#',
      imageUrl: 'https://randomuser.me/api/portraits/men/34.jpg',
    },
  },
];

export default function Example() {
  return (
    <div className="bg-gray-950 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2 className="text-4xl font-semibold tracking-tight text-pretty text-white sm:text-5xl">
            Real Experiences from Our Community
          </h2>
          <p className="mt-2 text-lg/8 text-gray-300">
            Many people have shared how difficult it was to ace interviews, but also how our platform changed their preparation once they found the practice they needed.
          </p>
        </div>
        <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 border-t border-gray-700 pt-10 sm:mt-16 sm:pt-16 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {stories.map((story) => (
            <article key={story.id} className="flex max-w-xl flex-col items-start justify-between">
              <div className="flex items-center gap-x-4 text-xs">
                <time dateTime={story.datetime} className="text-gray-400">
                  {story.date}
                </time>
                <a
                  href={story.category.href}
                  className="relative z-10 rounded-full bg-gray-800/60 px-3 py-1.5 font-medium text-gray-300 hover:bg-gray-800"
                >
                  {story.category.title}
                </a>
              </div>
              <div className="group relative grow">
                <h3 className="mt-3 text-lg/6 font-semibold text-white group-hover:text-gray-300">
                  <a href={story.href}>
                    <span className="absolute inset-0" />
                    {story.title}
                  </a>
                </h3>
                <p className="mt-5 line-clamp-3 text-sm/6 text-gray-400">{story.description}</p>
              </div>
              <div className="relative mt-8 flex items-center gap-x-4 justify-self-end">
                <img alt="" src={story.author.imageUrl} className="size-10 rounded-full bg-gray-800" />
                <div className="text-sm/6">
                  <p className="font-semibold text-white">
                    <a href={story.author.href}>
                      <span className="absolute inset-0" />
                      {story.author.name}
                    </a>
                  </p>
                  <p className="text-gray-400">{story.author.role}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
