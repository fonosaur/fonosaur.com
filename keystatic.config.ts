import { config, fields, collection } from "@keystatic/core";

/**
 * FONOSAUR — Keystatic content config.
 *
 * Storage:
 *  - Local mode in dev (reads/writes files on disk).
 *  - GitHub mode in production, so you can post Field Notes from your phone
 *    via the deployed /keystatic admin (commits straight to the repo).
 *    Set `repo` below to your repo, and see SETUP.md for the auth step.
 */
export default config({
  storage:
    process.env.NODE_ENV === "production" &&
    process.env.KEYSTATIC_GITHUB_CLIENT_ID
      ? { kind: "github", repo: "fonosaur/fonosaur.com" }
      : { kind: "local" },

  ui: { brand: { name: "FONOSAUR" } },

  collections: {
    fieldNotes: collection({
      label: "Field Notes",
      slugField: "title",
      path: "src/content/field-notes/*",
      format: { contentField: "body" },
      columns: ["title", "publishedAt"],
      schema: {
        title: fields.slug({ name: { label: "Title" } }),

        publishedAt: fields.date({
          label: "Published",
          defaultValue: { kind: "today" },
          validation: { isRequired: true },
        }),

        // Shown in the Explore feed — keep it to a line or two.
        summary: fields.text({
          label: "Summary",
          description:
            "One or two lines. This is what shows in the Explore feed.",
          multiline: true,
        }),

        // Tap-to-pick categories (extend this list anytime).
        tags: fields.multiselect({
          label: "Tags",
          options: [
            { label: "Finds", value: "finds" },
            { label: "Foley", value: "foley" },
            { label: "Process", value: "process" },
            { label: "Photo", value: "photo" },
            { label: "Live", value: "live" },
            { label: "Release", value: "release" },
          ],
        }),

        // Optional thumbnail for the feed.
        cover: fields.image({
          label: "Cover photo",
          description: "Optional — used as the thumbnail in the feed.",
          directory: "public/field-notes/images",
          publicPath: "/field-notes/images/",
        }),

        // The flexible part: a list where each item is one kind of media.
        // On a phone this is just: “Add → pick a type → upload or paste a URL”.
        media: fields.array(
          fields.conditional(
            fields.select({
              label: "Type",
              options: [
                { label: "Photo", value: "image" },
                { label: "Video / loop", value: "video" },
                { label: "Audio clip", value: "audio" },
                { label: "YouTube", value: "youtube" },
                { label: "SoundCloud", value: "soundcloud" },
                { label: "Mixcloud", value: "mixcloud" },
              ],
              defaultValue: "image",
            }),
            {
              image: fields.object({
                src: fields.image({
                  label: "Photo",
                  directory: "public/field-notes/images",
                  publicPath: "/field-notes/images/",
                  validation: { isRequired: true },
                }),
                alt: fields.text({ label: "Alt text" }),
              }),
              video: fields.object({
                src: fields.file({
                  label: "Video file (mp4 / webm)",
                  directory: "public/field-notes/video",
                  publicPath: "/field-notes/video/",
                  validation: { isRequired: true },
                }),
                poster: fields.image({
                  label: "Poster image (optional)",
                  directory: "public/field-notes/images",
                  publicPath: "/field-notes/images/",
                }),
              }),
              audio: fields.object({
                src: fields.file({
                  label: "Audio file (mp3)",
                  directory: "public/field-notes/audio",
                  publicPath: "/field-notes/audio/",
                  validation: { isRequired: true },
                }),
                title: fields.text({ label: "Label" }),
              }),
              youtube: fields.object({
                url: fields.url({
                  label: "YouTube URL",
                  validation: { isRequired: true },
                }),
              }),
              soundcloud: fields.object({
                url: fields.url({
                  label: "SoundCloud track URL",
                  validation: { isRequired: true },
                }),
              }),
              mixcloud: fields.object({
                url: fields.url({
                  label: "Mixcloud show URL",
                  validation: { isRequired: true },
                }),
              }),
            },
          ),
          {
            label: "Media",
            itemLabel: (props) => props.discriminant,
          },
        ),

        // Optional longer write-up (plain rich text — images/embeds go in Media above).
        body: fields.markdoc({ label: "Note" }),
      },
    }),
  },
});
