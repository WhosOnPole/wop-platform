import { Metadata } from 'next'
import { PageBackButton } from '@/components/page-back-button'

export const metadata: Metadata = {
  title: 'Terms of Service | Who\'s on Pole?',
  description: 'Terms of Service for Who\'s on Pole, LLC.',
}

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <PageBackButton variant="dark" />
      </div>
      <h1 className="text-4xl font-bold mb-6 text-center">Whosonpole, LLC – Terms of Service</h1>
      <p className="text-sm text-gray-500 text-center mb-12">Last Updated: March 1, 2026</p>

      <div className="max-w-4xl mx-auto prose prose-lg">
        <p className="mb-8">
          Welcome to Who&apos;s on Pole.
        </p>
        <p className="mb-8">
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Whosonpole platform, website, and related services (collectively, the &quot;Platform&quot;) operated by Whosonpole, LLC, a Georgia limited liability company located in Atlanta, Georgia, United States (&quot;Whosonpole,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
        </p>
        <p className="mb-4">
          By accessing or using the Platform, you agree to these Terms.
        </p>
        <p className="mb-8">
          If you do not agree, do not use the Platform.
        </p>

        <h2 className="text-2xl font-bold mb-4 mt-8">1. Eligibility</h2>
        <p className="mb-4">
          You must be at least 13 years old to use the Platform.
        </p>
        <p className="mb-4">
          Users under 13 are strictly prohibited.
        </p>
        <p className="mb-4">
          If you are under 18, you represent that you have permission from a parent or legal guardian to use the Platform and to make any payments.
        </p>
        <p className="mb-8">
          We may suspend or terminate accounts that violate age requirements.
        </p>

        <h2 className="text-2xl font-bold mb-4 mt-8">2. Nature of the Platform</h2>
        <p className="mb-4">
          Whosonpole is an independent online community for motorsport fans to engage through content creation, polls, discussions, rankings (&quot;grids&quot;), stories, and fan interaction.
        </p>
        <p className="mb-8">
          The Platform is not affiliated with or endorsed by any motorsport organization (see Section 15).
        </p>

        <h2 className="text-2xl font-bold mb-4 mt-8">3. Account Registration</h2>
        <p className="mb-4">
          Accounts are created using third-party authentication providers (such as Google, Apple, TikTok, or Instagram).
        </p>
        <p className="mb-4">
          You agree that:
        </p>
        <ul className="list-disc list-inside mb-4 space-y-1">
          <li>information you provide is accurate;</li>
          <li>you will maintain only one primary account unless permitted;</li>
          <li>you are responsible for activity under your account.</li>
        </ul>
        <p className="mb-8">
          We do not store passwords for third-party authentication services.
        </p>

        <h2 className="text-2xl font-bold mb-4 mt-8">4. Community Standards & Conduct</h2>
        <p className="mb-4">
          We aim to maintain a respectful and inclusive community.
        </p>
        <p className="mb-4">
          You agree NOT to:
        </p>
        <ul className="list-disc list-inside mb-4 space-y-1">
          <li>harass, bully, or threaten others;</li>
          <li>post hateful, abusive, or defamatory content;</li>
          <li>impersonate drivers, teams, organizations, or other users;</li>
          <li>misrepresent affiliations;</li>
          <li>upload unlawful or infringing material;</li>
          <li>disrupt or interfere with Platform operation.</li>
        </ul>
        <p className="mb-4">
          We reserve the right, at our sole discretion, to remove content or terminate accounts for violations.
        </p>
        <p className="mb-8">
          Paid accounts may be terminated without refund if rules are violated.
        </p>

        <h2 className="text-2xl font-bold mb-4 mt-8">5. Community Support Contributions</h2>
        <p className="mb-4">
          Access to certain Platform features may require a Community Support Contribution.
        </p>
        <p className="mb-4">
          Community Support Contributions:
        </p>
        <ul className="list-disc list-inside mb-4 space-y-1">
          <li>support platform development and operational costs;</li>
          <li>are voluntary payments for platform access;</li>
          <li>are not donations;</li>
          <li>are non-refundable unless required by law;</li>
          <li>do not automatically renew;</li>
          <li>must be manually renewed by users.</li>
        </ul>
        <p className="mb-4">
          Payments are processed exclusively by third-party providers such as Stripe or PayPal.
        </p>
        <p className="mb-8">
          Whosonpole does not store financial payment information.
        </p>

        <h2 className="text-2xl font-bold mb-4 mt-8">6. No Purchase Required for Recognition or Rewards</h2>
        <p className="mb-4">
          Community Support Contributions:
        </p>
        <ul className="list-disc list-inside mb-4 space-y-1">
          <li>do not increase chances of receiving recognition, rewards, or experiences;</li>
          <li>are not entries into a contest, lottery, or sweepstakes;</li>
          <li>are not payments for prizes.</li>
        </ul>
        <p className="mb-8">
          Users may participate and be recognized through content contributions regardless of payment status where permitted by the Platform.
        </p>

        <h2 className="text-2xl font-bold mb-4 mt-8">7. Community Recognition, Rewards, and Experiences</h2>
        <p className="mb-4">
          From time to time, Whosonpole may, at its sole discretion, offer community recognition initiatives, gifts, merchandise, travel opportunities, event access, or other experiences (&quot;Community Rewards&quot;).
        </p>
        <p className="mb-4">
          You acknowledge:
        </p>
        <ul className="list-disc list-inside mb-4 space-y-1">
          <li>Community Rewards are discretionary;</li>
          <li>availability depends on platform growth and resources;</li>
          <li>rewards are not guaranteed;</li>
          <li>timing, eligibility, and selection criteria may change at any time;</li>
          <li>rewards may be modified, delayed, or cancelled without liability.</li>
        </ul>
        <p className="mb-8">
          Selection decisions are final and made solely by Whosonpole administrators.
        </p>

        <h2 className="text-2xl font-bold mb-4 mt-8">8. User Content</h2>
        <p className="mb-4">
          You retain ownership of content you submit (&quot;User Content&quot;).
        </p>
        <p className="mb-4">
          However, by posting content, you grant Whosonpole a:
        </p>
        <p className="mb-4">
          worldwide, non-exclusive, royalty-free, transferable, sublicensable license to use, reproduce, modify, adapt, publish, distribute, display, and promote such content in connection with operating, improving, and promoting the Platform.
        </p>
        <p className="mb-4">
          This includes use on:
        </p>
        <ul className="list-disc list-inside mb-4 space-y-1">
          <li>Instagram</li>
          <li>TikTok</li>
          <li>YouTube</li>
          <li>marketing materials</li>
          <li>promotional campaigns</li>
          <li>third-party platforms</li>
        </ul>
        <p className="mb-4">
          You are not entitled to compensation for such use unless expressly agreed in writing.
        </p>
        <p className="mb-8">
          You represent that you have the rights necessary to post your content.
        </p>

        <h2 className="text-2xl font-bold mb-4 mt-8">9. Content Moderation</h2>
        <p className="mb-4">
          Whosonpole uses post-moderation and community reporting.
        </p>
        <p className="mb-4">
          Whosonpole is committed to maintaining a respectful and positive community environment. Users may report content they believe violates these Terms, including harassment, bullying, impersonation, copyright infringement, or other harmful or unlawful material.
        </p>
        <p className="mb-4">
          If you believe content violates our policies, please contact us at team@whosonpole.org and include:
        </p>
        <ul className="list-disc list-inside mb-4 space-y-1">
          <li>a description of the content,</li>
          <li>the location or link to the content,</li>
          <li>the reason for the report, and</li>
          <li>any supporting information.</li>
        </ul>
        <p className="mb-4">
          We review reports in good faith and may, at our sole discretion, remove content, restrict visibility, suspend accounts, or terminate access where we determine a violation has occurred.
        </p>
        <p className="mb-4">
          Submission of a report does not guarantee removal of content, and Whosonpole is not obligated to act on every report. We may also take action without receiving a report where necessary to protect the community or Platform integrity.
        </p>
        <p className="mb-4">
          We may:
        </p>
        <ul className="list-disc list-inside mb-4 space-y-1">
          <li>remove content;</li>
          <li>restrict visibility;</li>
          <li>suspend accounts;</li>
          <li>terminate access</li>
        </ul>
        <p className="mb-4">
          at our sole discretion and without prior notice.
        </p>
        <p className="mb-8">
          We are not obligated to monitor all content.
        </p>

        <h2 className="text-2xl font-bold mb-4 mt-8">10. Copyright & DMCA Policy</h2>
        <p className="mb-4">
          If you believe content infringes your copyright, contact:
        </p>
        <p className="mb-4">
          team@whosonpole.org
        </p>
        <p className="mb-4">
          Include:
        </p>
        <ul className="list-disc list-inside mb-4 space-y-1">
          <li>identification of copyrighted work,</li>
          <li>location of infringing material,</li>
          <li>contact information,</li>
          <li>good-faith statement,</li>
          <li>signature.</li>
        </ul>
        <p className="mb-8">
          We may remove allegedly infringing content and terminate repeat infringers.
        </p>

        <h2 className="text-2xl font-bold mb-4 mt-8">11. Meetups and Real-World Interactions</h2>
        <p className="mb-4">
          Users may indicate attendance at events or voluntarily meet other users.
        </p>
        <p className="mb-4">
          Unless explicitly stated otherwise:
        </p>
        <ul className="list-disc list-inside mb-4 space-y-1">
          <li>Whosonpole does not organize or supervise meetups;</li>
          <li>participation is voluntary;</li>
          <li>users are responsible for their own safety and conduct.</li>
        </ul>
        <p className="mb-8">
          Future community gatherings may be offered at our discretion and may require additional terms.
        </p>

        <h2 className="text-2xl font-bold mb-4 mt-8">12. Intellectual Property</h2>
        <p className="mb-4">
          The Platform design, branding, and software are owned by Whosonpole.
        </p>
        <p className="mb-8">
          You may not copy, distribute, or reverse engineer Platform materials without permission.
        </p>

        <h2 className="text-2xl font-bold mb-4 mt-8">13. Third-Party Services</h2>
        <p className="mb-4">
          The Platform integrates third-party services including authentication providers and payment processors.
        </p>
        <p className="mb-8">
          We are not responsible for third-party services or their policies.
        </p>

        <h2 className="text-2xl font-bold mb-4 mt-8">14. Privacy</h2>
        <p className="mb-8">
          Your use of the Platform is governed by our Privacy Policy, incorporated by reference.
        </p>

        <h2 className="text-2xl font-bold mb-4 mt-8">15. Non-Affiliation and Trademark Disclaimer</h2>
        <p className="mb-4">
          Who&apos;s on Pole is an independent fan-created platform operated by Whosonpole, LLC and is not affiliated with, endorsed by, sponsored by, approved by, or in any way officially connected with:
        </p>
        <ul className="list-disc list-inside mb-4 space-y-1">
          <li>Formula One Management Limited;</li>
          <li>Formula 1®;</li>
          <li>the FIA (Fédération Internationale de l&apos;Automobile);</li>
          <li>any Formula 1 teams, constructors, drivers, personnel, or representatives;</li>
          <li>team owners or team affiliates;</li>
          <li>race promoters or event organizers;</li>
          <li>official broadcasters or media partners;</li>
          <li>sponsors, commercial partners, licensors, or affiliated organizations associated with Formula 1 or FIA-sanctioned competitions.</li>
        </ul>
        <p className="mb-4">
          Formula 1®, F1®, FIA®, and all related names, marks, logos, team names, event names, trade dress, and associated intellectual property are registered trademarks or proprietary rights of their respective owners.
        </p>
        <p className="mb-4">
          All such trademarks and references appearing on the Platform are used solely for purposes of identification, commentary, criticism, news reporting, and fan discussion in accordance with applicable trademark and fair use laws.
        </p>
        <p className="mb-4">
          No use of names, images, likenesses, or references on the Platform is intended to suggest:
        </p>
        <ul className="list-disc list-inside mb-4 space-y-1">
          <li>sponsorship,</li>
          <li>partnership,</li>
          <li>endorsement,</li>
          <li>authorization,</li>
          <li>approval, or</li>
          <li>official association</li>
        </ul>
        <p className="mb-4">
          between Whosonpole and any motorsport organization or rights holder.
        </p>
        <p className="mb-4">
          Whosonpole does not claim ownership of any third-party trademarks or intellectual property referenced on the Platform. All rights remain with their respective owners.
        </p>
        <p className="mb-4">
          Any editorial imagery or media used on the Platform is displayed for informational or identification purposes only and is not used to advertise, promote, or sell products or services on behalf of any motorsport entity.
        </p>
        <p className="mb-8">
          If any rights holder believes material appearing on the Platform infringes their rights, they may contact us at team@whosonpole.org, and we will promptly review and address the concern.
        </p>

        <h2 className="text-2xl font-bold mb-4 mt-8">16. Account Termination</h2>
        <p className="mb-4">
          We may suspend or terminate accounts at any time for:
        </p>
        <ul className="list-disc list-inside mb-4 space-y-1">
          <li>Terms violations;</li>
          <li>harmful conduct;</li>
          <li>legal risk;</li>
          <li>platform integrity concerns.</li>
        </ul>
        <p className="mb-8">
          No refunds will be issued for terminated accounts except where required by law.
        </p>

        <h2 className="text-2xl font-bold mb-4 mt-8">17. Disclaimer of Warranties</h2>
        <p className="mb-4">
          The Platform is provided &quot;as is&quot; and &quot;as available.&quot;
        </p>
        <p className="mb-4">
          We make no guarantees regarding:
        </p>
        <ul className="list-disc list-inside mb-4 space-y-1">
          <li>uninterrupted service;</li>
          <li>accuracy of content;</li>
          <li>availability of features or rewards.</li>
        </ul>

        <h2 className="text-2xl font-bold mb-4 mt-8">18. Limitation of Liability</h2>
        <p className="mb-4">
          To the fullest extent permitted by law, Whosonpole shall not be liable for:
        </p>
        <ul className="list-disc list-inside mb-4 space-y-1">
          <li>indirect or consequential damages;</li>
          <li>lost profits or opportunities;</li>
          <li>user interactions;</li>
          <li>third-party conduct;</li>
          <li>event attendance outcomes.</li>
        </ul>
        <p className="mb-8">
          Total liability shall not exceed the amount paid by you to Whosonpole in the previous 12 months.
        </p>

        <h2 className="text-2xl font-bold mb-4 mt-8">19. Arbitration Agreement & Class Action Waiver</h2>
        <p className="mb-4">
          Any dispute arising from these Terms shall be resolved by binding arbitration in Georgia, USA.
        </p>
        <p className="mb-4">
          You agree:
        </p>
        <ul className="list-disc list-inside mb-4 space-y-1">
          <li>to waive trial by jury;</li>
          <li>to waive participation in class or collective actions.</li>
        </ul>
        <p className="mb-8">
          Arbitration shall be conducted individually.
        </p>

        <h2 className="text-2xl font-bold mb-4 mt-8">20. Governing Law</h2>
        <p className="mb-8">
          These Terms are governed by the laws of the State of Georgia, United States, without regard to conflict-of-law principles.
        </p>

        <h2 className="text-2xl font-bold mb-4 mt-8">21. Changes to Terms</h2>
        <p className="mb-8">
          We may update these Terms periodically. Continued use of the Platform constitutes acceptance of updated Terms.
        </p>

        <h2 className="text-2xl font-bold mb-4 mt-8">22. Contact</h2>
        <p className="mb-4">
          Whosonpole, LLC<br />
          Atlanta, Georgia, USA<br />
          Email: team@whosonpole.org
        </p>
      </div>
    </div>
  )
}
