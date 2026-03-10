import {
  ConnectionStatus,
  MediaStage,
  MediaType,
  Platform,
  PostAction,
  PostStatus,
  PrismaClient,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.postLog.deleteMany();
  await prisma.post.deleteMany();
  await prisma.platformConnection.deleteMany();

  const brandName = "Delicious Wines";

  await prisma.platformConnection.createMany({
    data: [
      {
        platform: Platform.FACEBOOK,
        accountName: brandName,
        accountId: "fb_428301",
        accessToken: "encrypted-facebook-token-placeholder",
        tokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        metadata: { pageId: "13299822" },
        status: ConnectionStatus.ACTIVE,
      },
      {
        platform: Platform.INSTAGRAM,
        accountName: brandName,
        accountId: "ig_908721",
        accessToken: "encrypted-instagram-token-placeholder",
        tokenExpiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        metadata: { businessId: "99122812" },
        status: ConnectionStatus.ACTIVE,
      },
    ],
  });

  const samplePosts = [
    {
      title: "Spring Collection Teaser",
      content: "Spring cellar picks are here. Reserve your tasting slot today.",
      localMediaPaths: ["https://images.example.com/wine-spring.jpg"],
      cdnMediaUrls: ["https://images.example.com/wine-spring.jpg"],
      mediaType: MediaType.IMAGE,
      mediaStage: MediaStage.CDN,
      status: PostStatus.DRAFT,
      platforms: [Platform.FACEBOOK, Platform.INSTAGRAM],
      aiGenerated: true,
      aiPrompt: "Create excitement around spring wine collection launch",
      logs: [{ action: PostAction.CREATED, details: "Draft created by AI assistant" }],
    },
    {
      title: "Weekend Tasting Promo",
      content: "Join us this Saturday for a guided tasting and chef-paired bites.",
      localMediaPaths: ["https://images.example.com/tasting-night.jpg"],
      cdnMediaUrls: ["https://images.example.com/tasting-night.jpg"],
      mediaType: MediaType.CAROUSEL,
      mediaStage: MediaStage.CDN,
      status: PostStatus.PENDING_APPROVAL,
      platforms: [Platform.FACEBOOK, Platform.INSTAGRAM],
      aiGenerated: true,
      aiPrompt: "Promote a premium tasting event this weekend",
      logs: [{ action: PostAction.CREATED, details: "Waiting for manager approval" }],
    },
    {
      title: "Staff Favorite Spotlight",
      content: "Our sommelier's pick this week: bold reds from family vineyards.",
      localMediaPaths: ["https://images.example.com/staff-favorite.jpg"],
      cdnMediaUrls: ["https://images.example.com/staff-favorite.jpg"],
      mediaType: MediaType.IMAGE,
      mediaStage: MediaStage.CDN,
      status: PostStatus.APPROVED,
      platforms: [Platform.INSTAGRAM],
      approvedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      aiGenerated: false,
      aiPrompt: null,
      logs: [
        { action: PostAction.CREATED, details: "Post drafted manually" },
        { action: PostAction.APPROVED, details: "Approved by owner" },
      ],
    },
    {
      title: "Friday Live Session",
      content: "Catch our Friday live Q&A about pairing tips and cellar storage.",
      localMediaPaths: ["https://images.example.com/live-session.jpg"],
      cdnMediaUrls: ["https://images.example.com/live-session.jpg"],
      mediaType: MediaType.REEL,
      mediaStage: MediaStage.CDN,
      status: PostStatus.SCHEDULED,
      platforms: [Platform.FACEBOOK, Platform.INSTAGRAM],
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      aiGenerated: true,
      aiPrompt: "Draft a short promo for this week's live session",
      logs: [
        { action: PostAction.CREATED, details: "Generated from campaign prompt" },
        { action: PostAction.SCHEDULED, details: "Scheduled for tomorrow 6 PM" },
      ],
    },
    {
      title: "Customer Story",
      content: "Thank you to our community for sharing your favorite pairings this month.",
      localMediaPaths: ["https://images.example.com/customer-story.jpg"],
      cdnMediaUrls: ["https://images.example.com/customer-story.jpg"],
      mediaType: MediaType.IMAGE,
      mediaStage: MediaStage.CDN,
      status: PostStatus.PUBLISHED,
      platforms: [Platform.FACEBOOK, Platform.INSTAGRAM],
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      aiGenerated: false,
      aiPrompt: null,
      logs: [
        { action: PostAction.CREATED, details: "Written from customer feedback" },
        { action: PostAction.APPROVED, details: "Approved by owner" },
        { action: PostAction.PUBLISHED, details: "Published successfully to Facebook and Instagram" },
      ],
    },
  ];

  for (const postData of samplePosts) {
    const { logs, ...post } = postData;

    await prisma.post.create({
      data: {
        ...post,
        logs: {
          create: logs,
        },
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
