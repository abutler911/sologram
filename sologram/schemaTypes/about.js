export default {
  name: 'aboutPage',
  title: 'About Page',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Page Title',
      type: 'string',
    },
    {
      name: 'profileImage',
      title: 'Profile Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'content',
      title: 'Main Content',
      type: 'array',
      of: [{type: 'block'}],
    },
    {
      name: 'lastUpdated',
      title: 'Last Updated',
      type: 'datetime',
    },
  ],
}
