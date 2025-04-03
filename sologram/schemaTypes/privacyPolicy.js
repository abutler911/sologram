export default {
  name: 'privacyPolicy',
  title: 'Privacy Policy',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Page Title',
      type: 'string',
    },
    {
      name: 'lastUpdated',
      title: 'Last Updated',
      type: 'date',
    },
    {
      name: 'sections',
      title: 'Sections',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'section',
          title: 'Section',
          fields: [
            {name: 'heading', title: 'Heading', type: 'string'},
            {
              name: 'content',
              title: 'Content',
              type: 'array',
              of: [
                {type: 'block'},
                {
                  type: 'object',
                  name: 'list',
                  title: 'List',
                  fields: [
                    {
                      name: 'items',
                      title: 'List Items',
                      type: 'array',
                      of: [{type: 'string'}],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
