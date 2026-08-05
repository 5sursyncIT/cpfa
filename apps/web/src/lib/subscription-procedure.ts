// « Procédure d'abonnement annuel à la bibliothèque » — texte officiel signé
// par le Directeur Général, rendu à la fois par la page
// /bibliotheque/abonnement et par le PDF téléchargeable
// (/bibliotheque/abonnement/procedure.pdf). Une seule source pour les deux :
// le PDF ne peut pas dériver de la page publiée.
//
// Les montants et les délais ne sont PAS écrits en dur ici : ils viennent de
// library-rules.ts, qui reste l'unique source des invariants métier.

import { defaultLocale, type Locale } from '@/i18n/request';
import type { LibraryTiers } from './library-pricing';
import {
  LIBRARY_DAILY_PENALTY_XOF,
  LIBRARY_LATE_GRACE_DAYS,
  LIBRARY_LOAN_DAYS,
  LIBRARY_OPENING_HOURS,
  LIBRARY_PHOTOCOPY_XOF_PER_PAGE,
  LIBRARY_RENEWAL_NOTICE_DAYS,
  LIBRARY_TIERS,
} from './library-rules';

export type ProcedureListItem = { text: string; children?: string[] };
export type ProcedureBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: ProcedureListItem[] };
export type ProcedureSubsection = { number: string; title: string; blocks: ProcedureBlock[] };
export type ProcedureSection = {
  number: string;
  title: string;
  blocks: ProcedureBlock[];
  subsections: ProcedureSubsection[];
};
export type SubscriptionProcedure = {
  title: string;
  subtitle: string;
  intro: string;
  sections: ProcedureSection[];
  closing: string[];
  tagline: string;
  signature: string;
};

/** 10000 → « 10 000 FCFA » (fr) / « 10,000 FCFA » (en). */
function xof(amount: number, locale: Locale): string {
  const grouped = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, locale === 'en' ? ',' : ' ');
  return `${grouped} FCFA`;
}

function frenchProcedure(tiers: LibraryTiers): SubscriptionProcedure {
  const { STUDENT, PROFESSIONAL, HOME_LOAN } = tiers;
  const f = (amount: number) => xof(amount, 'fr');
  return {
    title: "Procédure d'abonnement annuel à la bibliothèque",
    subtitle:
      "Centre Professionnel de Formation en Assurance — Unité décentralisée de l'Institut International des Assurances (IIA) de Yaoundé",
    intro:
      "Pour permettre aux abonnés de profiter pleinement de nos services, nous avons mis en place une procédure d'abonnement simple et accessible. Cette procédure vise à vous faciliter l'accès à notre collection dans un cadre organisé et professionnel.",
    sections: [
      {
        number: 'I',
        title: "Validation des conditions d'abonnement",
        blocks: [
          {
            kind: 'paragraph',
            text: "Pour garantir un service de qualité et une organisation optimale, nous vous invitons à prendre connaissance des conditions d'abonnement à notre bibliothèque. Ces règles définissent les droits et obligations des abonnés, ainsi que les modalités d'accès, de prêt et de retour des ouvrages. Elles visent à assurer une expérience harmonieuse pour tous les usagers.",
          },
        ],
        subsections: [
          {
            number: '1',
            title: "Les modalités d'abonnement",
            blocks: [
              {
                kind: 'paragraph',
                text: "Nous proposons deux types d'abonnement adaptés à vos besoins :",
              },
              {
                kind: 'list',
                items: [
                  {
                    text: `Abonnement annuel de ${f(STUDENT.priceXof)} (pour les étudiants) et ${f(PROFESSIONAL.priceXof)} (pour les professionnels) : donne accès à la consultation des ouvrages sur place.`,
                  },
                  {
                    text: `Abonnement annuel avec emprunt à domicile à ${f(HOME_LOAN.priceXof)}, qui comprend :`,
                    children: [
                      `Le droit d'abonnement annuel (${f(HOME_LOAN.feeXof)}).`,
                      `Une caution remboursable en fin d'abonnement de ${f(HOME_LOAN.depositXof)} pour garantir les emprunts.`,
                    ],
                  },
                ],
              },
            ],
          },
          {
            number: '2',
            title: 'Les pièces à fournir',
            blocks: [
              {
                kind: 'list',
                items: [
                  { text: "Présenter une photocopie de sa carte nationale d'identité." },
                  { text: 'Présenter deux (02) photos.' },
                  { text: "Remplir le formulaire d'abonnement." },
                ],
              },
            ],
          },
          {
            number: '3',
            title: 'Les horaires de consultation',
            blocks: [
              {
                kind: 'paragraph',
                text: `La bibliothèque du CPFA est ouverte du lundi au vendredi, de ${LIBRARY_OPENING_HOURS.opensAt} à ${LIBRARY_OPENING_HOURS.closesAt}.`,
              },
            ],
          },
          {
            number: '4',
            title: 'Les droits des abonnés',
            blocks: [
              {
                kind: 'list',
                items: [
                  {
                    text: "Accès aux collections, sauf aux livres exclus de l'emprunt :",
                    children: [
                      'Consultation des ouvrages sur place.',
                      'Accès aux espaces de lecture et de travail.',
                    ],
                  },
                  {
                    text: "Emprunt de documents, sauf ceux qui sont exclus de l'emprunt :",
                    children: [
                      "Possibilité d'emprunter des livres, magazines ou autres supports selon le type d'abonnement.",
                      'Renouvellement des emprunts sous certaines conditions (par exemple, absence de réservation par un autre abonné).',
                    ],
                  },
                  {
                    text: 'Bénéficier de notre service facultatif :',
                    children: [
                      `01 photocopieuse est disponible (${LIBRARY_PHOTOCOPY_XOF_PER_PAGE} F la page).`,
                    ],
                  },
                  { text: 'Respect de la confidentialité des données personnelles des abonnés.' },
                ],
              },
            ],
          },
          {
            number: '5',
            title: 'Les obligations des abonnés',
            blocks: [
              {
                kind: 'list',
                items: [
                  {
                    text: 'Respect des délais : retourner les ouvrages empruntés dans les délais impartis.',
                  },
                  {
                    text: 'Bonne utilisation des ouvrages : manipuler les livres et autres supports avec soin pour éviter toute détérioration, et signaler immédiatement tout dommage constaté sur un ouvrage emprunté.',
                  },
                  {
                    text: 'Respect des règles internes : respecter les horaires de consultation et observer un comportement responsable dans les espaces de lecture.',
                  },
                  {
                    text: "Engagement financier : s'acquitter des frais d'abonnement et des éventuelles pénalités en cas de retard ou de perte d'un ouvrage.",
                  },
                  {
                    text: "Retour des ouvrages en bon état : ne pas annoter, surligner ou plier les pages des livres empruntés ; en cas de perte ou de détérioration d'un ouvrage, en rembourser la valeur.",
                  },
                  {
                    text: `Respect des interdictions : pas de double emprunt autorisé, limitation à un exemplaire par ouvrage et par abonné.`,
                  },
                ],
              },
            ],
          },
          {
            number: '6',
            title: 'Les sanctions',
            blocks: [
              { kind: 'paragraph', text: 'Pour les consultations sur place :' },
              {
                kind: 'list',
                items: [
                  {
                    text: "Détérioration des ouvrages : remplacement de l'ouvrage par un exemplaire identique, ou paiement de sa valeur estimée si le remplacement n'est pas possible.",
                  },
                  {
                    text: "Non-respect des conditions de consultation : suspension temporaire ou définitive de l'accès à la bibliothèque, ou interdiction de consultation sur place.",
                  },
                  {
                    text: "Comportement inapproprié dans les locaux : avertissement verbal ou écrit, puis suspension temporaire ou définitive de l'abonnement en cas de récidive (perturbation, non-respect des règles d'hygiène ou de silence).",
                  },
                ],
              },
              { kind: 'paragraph', text: 'Pour les emprunts à domicile :' },
              {
                kind: 'list',
                items: [
                  {
                    text: `Retard dans le retour des ouvrages : s'il s'agit du dernier emprunt avant la fin de l'abonnement, la caution n'est pas remboursée tant que le livre n'est pas retourné. Dans le cas contraire, une amende de ${LIBRARY_DAILY_PENALTY_XOF} F par jour est appliquée si le retard excède ${LIBRARY_LATE_GRACE_DAYS} jours.`,
                  },
                  {
                    text: "Perte ou détérioration des ouvrages : remplacement de l'ouvrage par un exemplaire identique, ou paiement de sa valeur estimée si le remplacement n'est pas possible.",
                  },
                ],
              },
              { kind: 'paragraph', text: 'NB :' },
              {
                kind: 'list',
                items: [
                  { text: 'Certains livres ne sont pas autorisés au prêt à domicile.' },
                  {
                    text: `La durée des prêts à domicile est de ${LIBRARY_LOAN_DAYS} jours par ouvrage.`,
                  },
                  {
                    text: "La caution n'est pas remboursable en cas de perte, de détérioration, de non-compensation ou de vol de livres.",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        number: 'II',
        title: "Enregistrement de l'abonné",
        blocks: [
          {
            kind: 'paragraph',
            text: "L'enregistrement est une étape essentielle pour formaliser une inscription à la bibliothèque. Il permet de recueillir les informations nécessaires de l'abonné et de lui attribuer un identifiant unique, garantissant un accès personnalisé à la bibliothèque. Voici les démarches pour compléter cette étape :",
          },
          {
            kind: 'list',
            items: [
              {
                text: "Collecter les informations personnelles de l'abonné via un formulaire papier et numérique (nom, contact, adresse, etc.).",
              },
              {
                text: "Vérifier les pièces justificatives nécessaires (pièce d'identité, justificatif de domicile).",
              },
              { text: "Attribuer une carte et un numéro d'abonné unique." },
            ],
          },
        ],
        subsections: [],
      },
      {
        number: 'III',
        title: "Paiement et validation de l'abonnement",
        blocks: [
          {
            kind: 'paragraph',
            text: "Le paiement finalise l'inscription à la bibliothèque. Il est important pour la confirmation de l'abonnement et se fait en plusieurs étapes :",
          },
          {
            kind: 'list',
            items: [
              {
                text: "Procéder à l'encaissement des frais d'abonnement (espèces, Wave, Orange Money).",
              },
              { text: "Remettre un reçu de paiement à l'abonné, ainsi que sa carte d'abonnement." },
              { text: "Activer l'abonnement dans le système de gestion de la bibliothèque." },
            ],
          },
        ],
        subsections: [],
      },
      {
        number: 'IV',
        title: 'Consultation et emprunt des livres',
        blocks: [
          {
            kind: 'paragraph',
            text: 'Une fois votre abonnement validé, vous pouvez profiter de nos services de consultation sur place et, selon votre formule, emprunter des ouvrages à domicile. Il faudra nécessairement :',
          },
          {
            kind: 'list',
            items: [
              {
                text: "Pour l'abonné :",
                children: [
                  "Présenter la carte d'abonnement.",
                  'Consulter le catalogue des ressources documentaires disponibles.',
                  'Faire le choix du livre à consulter ou à emprunter.',
                ],
              },
              {
                text: 'Pour la bibliothécaire :',
                children: [
                  'Enregistrer les livres dans le système.',
                  'Expliquer la durée de prêt autorisée.',
                ],
              },
            ],
          },
        ],
        subsections: [],
      },
      {
        number: 'V',
        title: 'Suivi des prêts',
        blocks: [
          {
            kind: 'paragraph',
            text: 'Le suivi des prêts permet de garantir une gestion efficace des ouvrages empruntés. Grâce à nos rappels et à notre système de gestion, les abonnés peuvent respecter les délais tout en assurant la disponibilité des livres pour tous les usagers. Ce suivi consiste à :',
          },
          {
            kind: 'list',
            items: [
              {
                text: "Mettre en place un système de rappel automatisé (SMS, e-mail ou appel) pour notifier à l'abonné les dates d'échéance de retour.",
              },
              {
                text: 'Assurer un suivi des livres non retournés à temps et appliquer les pénalités prévues dans les conditions.',
              },
            ],
          },
        ],
        subsections: [],
      },
      {
        number: 'VI',
        title: 'Retour des livres',
        blocks: [
          {
            kind: 'paragraph',
            text: "Le retour des livres empruntés est une étape essentielle pour maintenir une bonne organisation et permettre à d'autres abonnés de profiter de nos collections. Sa gestion passe par le fait de :",
          },
          {
            kind: 'list',
            items: [
              { text: "Vérifier l'état des livres au retour." },
              { text: 'Mettre à jour le système pour signaler que le livre est disponible.' },
              {
                text: "En cas de retard, percevoir les frais de pénalité conformément aux conditions d'abonnement.",
              },
            ],
          },
        ],
        subsections: [],
      },
      {
        number: 'VII',
        title: 'Gestion des incidents',
        blocks: [
          {
            kind: 'paragraph',
            text: "En cas de perte, de retard ou de détérioration d'un ouvrage, une gestion adaptée est mise en place pour résoudre la situation tout en préservant les droits et responsabilités de chacun. Voici les mesures prévues pour ces cas particuliers :",
          },
          {
            kind: 'list',
            items: [
              {
                text: 'En cas de perte ou de détérioration :',
                children: [
                  "Informer l'abonné des mesures prises (remplacement, remboursement, pénalités).",
                  'Mettre à jour son statut dans le système pour permettre un nouvel emprunt après résolution.',
                ],
              },
            ],
          },
        ],
        subsections: [],
      },
      {
        number: 'VIII',
        title: "Renouvellement de l'abonnement",
        blocks: [
          {
            kind: 'paragraph',
            text: "Le renouvellement d'abonnement est une étape rapide qui permet de prolonger l'accès aux services de la bibliothèque sans interruption.",
          },
          {
            kind: 'list',
            items: [
              {
                text: `Notifier les abonnés de la date d'expiration de leur abonnement ${LIBRARY_RENEWAL_NOTICE_DAYS === 30 ? 'un mois' : `${LIBRARY_RENEWAL_NOTICE_DAYS} jours`} à l'avance.`,
              },
              {
                text: 'Faciliter le processus de renouvellement en proposant des options simples.',
              },
            ],
          },
        ],
        subsections: [],
      },
    ],
    closing: [
      "Grâce à une procédure simple et structurée, nous nous engageons à offrir un service de qualité et une expérience enrichissante. Que ce soit pour la consultation sur place ou l'emprunt à domicile, nous avons conçu des formules adaptées aux besoins des usagers. En respectant les règles établies, chaque abonné contribue à maintenir un cadre harmonieux et équitable pour tous.",
    ],
    tagline: 'Rejoignez-nous et faites de la lecture votre alliée au quotidien.',
    signature: 'Le Directeur Général',
  };
}

function englishProcedure(tiers: LibraryTiers): SubscriptionProcedure {
  const { STUDENT, PROFESSIONAL, HOME_LOAN } = tiers;
  const f = (amount: number) => xof(amount, 'en');
  return {
    title: 'Annual library subscription procedure',
    subtitle:
      'Professional Training Centre for the Insurance Industry — A decentralised unit of the International Institute of Insurance (IIA), Yaoundé',
    intro:
      'So that subscribers can make the most of our services, we have set up a simple, accessible subscription procedure. It is designed to give you access to our collection within an organised, professional framework.',
    sections: [
      {
        number: 'I',
        title: 'Subscription conditions',
        blocks: [
          {
            kind: 'paragraph',
            text: 'To guarantee a quality service and sound organisation, we invite you to read the conditions of subscription to our library. These rules set out the rights and obligations of subscribers, as well as the terms of access, borrowing and return. They are there to keep the experience harmonious for every user.',
          },
        ],
        subsections: [
          {
            number: '1',
            title: 'Subscription formulas',
            blocks: [
              { kind: 'paragraph', text: 'We offer two types of subscription:' },
              {
                kind: 'list',
                items: [
                  {
                    text: `Annual subscription of ${f(STUDENT.priceXof)} (students) or ${f(PROFESSIONAL.priceXof)} (professionals): gives access to on-site consultation of the collection.`,
                  },
                  {
                    text: `Annual subscription with home borrowing at ${f(HOME_LOAN.priceXof)}, comprising:`,
                    children: [
                      `The annual subscription fee (${f(HOME_LOAN.feeXof)}).`,
                      `A deposit of ${f(HOME_LOAN.depositXof)}, refundable at the end of the subscription, securing the loans.`,
                    ],
                  },
                ],
              },
            ],
          },
          {
            number: '2',
            title: 'Documents required',
            blocks: [
              {
                kind: 'list',
                items: [
                  { text: 'A photocopy of your national identity card.' },
                  { text: 'Two (02) photographs.' },
                  { text: 'A completed subscription form.' },
                ],
              },
            ],
          },
          {
            number: '3',
            title: 'Opening hours',
            blocks: [
              {
                kind: 'paragraph',
                text: `The CPFA library is open Monday to Friday, ${LIBRARY_OPENING_HOURS.opensAt.replace('h', ':')} to ${LIBRARY_OPENING_HOURS.closesAt.replace('h', ':')}.`,
              },
            ],
          },
          {
            number: '4',
            title: 'Subscriber rights',
            blocks: [
              {
                kind: 'list',
                items: [
                  {
                    text: 'Access to the collections, except for items excluded from borrowing:',
                    children: [
                      'On-site consultation of the collection.',
                      'Access to the reading and study areas.',
                    ],
                  },
                  {
                    text: 'Borrowing of documents, except those excluded from borrowing:',
                    children: [
                      'Books, magazines and other media may be borrowed depending on the subscription type.',
                      'Loans may be renewed under certain conditions (for instance, where no other subscriber has reserved the item).',
                    ],
                  },
                  {
                    text: 'Access to our optional service:',
                    children: [
                      `One photocopier is available (${LIBRARY_PHOTOCOPY_XOF_PER_PAGE} FCFA per page).`,
                    ],
                  },
                  { text: 'Confidentiality of subscribers’ personal data.' },
                ],
              },
            ],
          },
          {
            number: '5',
            title: 'Subscriber obligations',
            blocks: [
              {
                kind: 'list',
                items: [
                  { text: 'Deadlines: return borrowed items within the allotted time.' },
                  {
                    text: 'Proper use: handle books and other media with care to avoid damage, and report immediately any damage found on a borrowed item.',
                  },
                  {
                    text: 'Internal rules: observe the consultation hours and behave responsibly in the reading areas.',
                  },
                  {
                    text: 'Financial commitment: pay the subscription fee and any penalties for late return or loss of an item.',
                  },
                  {
                    text: 'Return in good condition: do not annotate, highlight or fold the pages of borrowed books; if an item is lost or damaged, reimburse its value.',
                  },
                  {
                    text: 'Prohibitions: no double borrowing — one copy per title per subscriber.',
                  },
                ],
              },
            ],
          },
          {
            number: '6',
            title: 'Penalties',
            blocks: [
              { kind: 'paragraph', text: 'For on-site consultation:' },
              {
                kind: 'list',
                items: [
                  {
                    text: 'Damage to an item: replacement with an identical copy, or payment of its estimated value where replacement is not possible.',
                  },
                  {
                    text: 'Breach of the consultation rules: temporary or permanent suspension of library access, or a ban on on-site consultation.',
                  },
                  {
                    text: 'Inappropriate behaviour on the premises: verbal or written warning, then temporary or permanent suspension of the subscription in the event of a repeat (disruption, breach of the hygiene or silence rules).',
                  },
                ],
              },
              { kind: 'paragraph', text: 'For home loans:' },
              {
                kind: 'list',
                items: [
                  {
                    text: `Late return: if this is the last loan before the subscription ends, the deposit is not refunded until the book is returned. Otherwise, a fine of ${LIBRARY_DAILY_PENALTY_XOF} FCFA per day applies once the delay exceeds ${LIBRARY_LATE_GRACE_DAYS} days.`,
                  },
                  {
                    text: 'Loss or damage: replacement with an identical copy, or payment of its estimated value where replacement is not possible.',
                  },
                ],
              },
              { kind: 'paragraph', text: 'Please note:' },
              {
                kind: 'list',
                items: [
                  { text: 'Some books may not be borrowed for home use.' },
                  { text: `Home loans run for ${LIBRARY_LOAN_DAYS} days per item.` },
                  {
                    text: 'The deposit is not refunded in the event of loss, damage, non-compensation or theft of books.',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        number: 'II',
        title: 'Subscriber registration',
        blocks: [
          {
            kind: 'paragraph',
            text: 'Registration formalises the library membership. It gathers the information needed about the subscriber and assigns a unique identifier, guaranteeing personalised access to the library. The steps are:',
          },
          {
            kind: 'list',
            items: [
              {
                text: 'Collect the subscriber’s personal details on a paper and digital form (name, contact, address, etc.).',
              },
              {
                text: 'Check the supporting documents (identity document, proof of address).',
              },
              { text: 'Issue a card and a unique subscriber number.' },
            ],
          },
        ],
        subsections: [],
      },
      {
        number: 'III',
        title: 'Payment and activation',
        blocks: [
          {
            kind: 'paragraph',
            text: 'Payment finalises the membership. It confirms the subscription and involves several steps:',
          },
          {
            kind: 'list',
            items: [
              { text: 'Collect the subscription fee (cash, Wave, Orange Money).' },
              { text: 'Hand the subscriber a payment receipt together with their member card.' },
              { text: 'Activate the subscription in the library management system.' },
            ],
          },
        ],
        subsections: [],
      },
      {
        number: 'IV',
        title: 'Consulting and borrowing books',
        blocks: [
          {
            kind: 'paragraph',
            text: 'Once your subscription is validated, you can use our on-site consultation service and, depending on your formula, borrow items for home use. This requires:',
          },
          {
            kind: 'list',
            items: [
              {
                text: 'From the subscriber:',
                children: [
                  'Present the member card.',
                  'Browse the catalogue of available documentary resources.',
                  'Choose the book to consult or borrow.',
                ],
              },
              {
                text: 'From the librarian:',
                children: [
                  'Record the items in the system.',
                  'Explain the authorised loan period.',
                ],
              },
            ],
          },
        ],
        subsections: [],
      },
      {
        number: 'V',
        title: 'Loan follow-up',
        blocks: [
          {
            kind: 'paragraph',
            text: 'Following up on loans keeps the collection well managed. Thanks to our reminders and management system, subscribers can meet the deadlines while keeping books available to everyone. Follow-up consists of:',
          },
          {
            kind: 'list',
            items: [
              {
                text: 'An automated reminder system (SMS, email or phone call) notifying subscribers of their return dates.',
              },
              {
                text: 'Tracking items not returned on time and applying the penalties set out in the conditions.',
              },
            ],
          },
        ],
        subsections: [],
      },
      {
        number: 'VI',
        title: 'Returning books',
        blocks: [
          {
            kind: 'paragraph',
            text: 'Returning borrowed books keeps the library organised and lets other subscribers enjoy the collection. It involves:',
          },
          {
            kind: 'list',
            items: [
              { text: 'Checking the condition of the items on return.' },
              { text: 'Updating the system to mark the book as available again.' },
              {
                text: 'Collecting late fees, where applicable, in line with the subscription conditions.',
              },
            ],
          },
        ],
        subsections: [],
      },
      {
        number: 'VII',
        title: 'Handling incidents',
        blocks: [
          {
            kind: 'paragraph',
            text: 'Where an item is lost, returned late or damaged, a suitable process resolves the situation while preserving everyone’s rights and responsibilities:',
          },
          {
            kind: 'list',
            items: [
              {
                text: 'In the event of loss or damage:',
                children: [
                  'Inform the subscriber of the measures taken (replacement, reimbursement, penalties).',
                  'Update their status in the system so they can borrow again once the matter is settled.',
                ],
              },
            ],
          },
        ],
        subsections: [],
      },
      {
        number: 'VIII',
        title: 'Renewing the subscription',
        blocks: [
          {
            kind: 'paragraph',
            text: 'Renewal is a quick step that extends access to the library services without interruption.',
          },
          {
            kind: 'list',
            items: [
              {
                text: `Notify subscribers of their expiry date ${LIBRARY_RENEWAL_NOTICE_DAYS === 30 ? 'one month' : `${LIBRARY_RENEWAL_NOTICE_DAYS} days`} in advance.`,
              },
              { text: 'Keep renewal simple by offering straightforward options.' },
            ],
          },
        ],
        subsections: [],
      },
    ],
    closing: [
      'With a simple, structured procedure, we commit to offering a quality service and a rewarding experience. Whether for on-site consultation or home borrowing, our formulas are designed around users’ needs. By observing the rules, every subscriber helps keep the setting harmonious and fair for all.',
    ],
    tagline: 'Join us, and make reading your daily ally.',
    signature: 'The Director General',
  };
}

export function getSubscriptionProcedure(
  locale: Locale = defaultLocale,
  tiers: LibraryTiers = LIBRARY_TIERS,
): SubscriptionProcedure {
  return locale === 'en' ? englishProcedure(tiers) : frenchProcedure(tiers);
}
