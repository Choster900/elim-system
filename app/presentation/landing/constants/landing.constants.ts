import communityDinnerImage from '~/assets/images/system/community-dinner.png'
import lifeSchoolImage from '~/assets/images/system/life-school.png'
import worshipServiceImage from '~/assets/images/system/worship-service.png'
import youthMinistryImage from '~/assets/images/system/youth-ministry.png'

export interface LandingNavLink {
    label: string
    href: string
}

export const landingNavLinks: LandingNavLink[] = [
    { label: 'Ministerios', href: '/#ministerios' },
    { label: 'Visión', href: '/#vision' },
    { label: 'Elim', href: '/#elim' },
    { label: 'Ubicación', href: '/#ubicacion' },
    { label: 'Contacto', href: '/#contacto' },
]

export const landingMinistries = [
    {
        title: 'Jóvenes en Acción',
        image: youthMinistryImage,
        description:
            'Un espacio dinámico para que las nuevas generaciones exploren su fe en un lenguaje actual.',
    },
    {
        title: 'Cena de Comunidad',
        image: communityDinnerImage,
        description:
            'Compartimos la mesa y la vida. Un encuentro mensual para fortalecer nuestros lazos fraternales.',
    },
    {
        title: 'Escuela de Vida',
        image: lifeSchoolImage,
        description:
            'Clases diseñadas para aplicar la sabiduría bíblica a los desafíos de la vida cotidiana.',
    },
    {
        title: 'Celebración de Fe',
        image: worshipServiceImage,
        description: 'Adoración que combina la liturgia clásica con la expresión contemporánea.',
    },
]

/**
 * Datos públicos de contacto de la iglesia. Los valores entre corchetes son marcadores:
 * reemplázalos aquí y se actualizan en la portada, la sección de ubicación y el pie.
 */
export const landingContact = {
    // Nombre del lugar tal como aparece en Google Maps.
    address: 'Centro de Retiro Iglesia Elim, Lourdes',
    serviceSchedule: 'Domingos · [HORA]',
    phone: '[TELÉFONO]',
    email: '[CORREO]',
    // Botón "Cómo llegar" y punto del mapa.
    mapsUrl: 'https://maps.app.goo.gl/bhFRzfuVBxpoXUTy5',
    coordinates: [13.711409, -89.359812] as [latitude: number, longitude: number],
    socials: {
        instagram: '',
        facebook: '',
        youtube: '',
    },
}
