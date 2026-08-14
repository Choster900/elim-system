export default [
    {
        name: 'member-create',
        path: '/comunidad/miembros/nuevo',
        component: () => import('~/presentation/members/view/MemberFormView.vue'),
        meta: {
            layout: 'dashboard',
        },
    },
    {
        name: 'members',
        path: '/comunidad/miembros',
        component: () => import('~/presentation/members/view/MembersView.vue'),
        meta: {
            layout: 'dashboard',
        },
    },
]
