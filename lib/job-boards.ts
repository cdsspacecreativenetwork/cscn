/**
 * Job board data — structured as it would arrive from a backend API endpoint.
 *
 * Future API contract:
 *   GET /api/job-boards
 *   Returns: JobBoard[]
 *
 * Logos: local SVG assets in /public/assets/community/logo-*.svg
 *   - Simple Icons source (simpleicons.org) for available brands
 *   - Bespoke monogram SVG for brands not in Simple Icons
 */
export interface JobBoard {
  id: string;
  name: string;
  /** Local SVG logo path served from /public */
  logoUrl: string;
  /** Soft brand-matched background colour for the logo container */
  logoBg: string;
  /** Deep-linked URL pre-filtered for design / AI / creative-tech roles */
  url: string;
  /** True if the logoUrl points to a full-size Figma design frame rather than a simple logo */
  isDesignFrame?: boolean;
}

export const JOB_BOARDS: JobBoard[] = [
  {
    id: 'linkedin',
    name: 'LinkedIn Jobs',
    logoUrl: '/assets/community/logo-linkedin.svg',
    logoBg: '#EBF3FB',
    url: 'https://www.linkedin.com/jobs/search/?keywords=UI%20UX%20Designer%20AI%20Developer&f_WT=2&f_TPR=r86400',
  },
  {
    id: 'google-jobs',
    name: 'Google Jobs',
    logoUrl: '/assets/community/logo-google.svg',
    logoBg: '#FFF8EC',
    url: 'https://www.google.com/search?q=UI+UX+designer+AI+developer+remote+jobs&ibp=htl;jobs',
    isDesignFrame: true,
  },
  {
    id: 'indeed',
    name: 'Indeed',
    logoUrl: '/assets/community/logo-indeed.svg',
    logoBg: '#F0F4FF',
    url: 'https://www.indeed.com/jobs?q=UI+UX+designer+AI+developer&l=Remote&sc=0kf%3Aattr%28DSQF7%29%3B',
    isDesignFrame: true,
  },
  {
    id: 'glassdoor',
    name: 'Glassdoor',
    logoUrl: '/assets/community/logo-glassdoor-design.svg',
    logoBg: '#EDFBF0',
    url: 'https://www.glassdoor.com/Job/remote-ui-ux-designer-jobs-SRCH_IL.0,6_IS11047_KO7,21.htm',
    isDesignFrame: true,
  },
  {
    id: 'upwork',
    name: 'Upwork',
    logoUrl: '/assets/community/logo-upwork.svg',
    logoBg: '#F0FAF0',
    url: 'https://www.upwork.com/nx/jobs/search/?q=UI+UX+designer+AI&sort=recency',
    isDesignFrame: true,
  },
  {
    id: 'dribbble',
    name: 'Dribbble',
    logoUrl: '/assets/community/logo-dribbble.svg',
    logoBg: '#FFF0F5',
    url: 'https://dribbble.com/jobs?location=Anywhere&skills=ui-design%2Cux-design%2Cfigma%2Cai',
  },
  {
    id: 'behance',
    name: 'Behance',
    logoUrl: '/assets/community/logo-behance.svg',
    logoBg: '#EEF0FF',
    url: 'https://www.behance.net/joblist?field=ui-ux&field=graphic-design&field=motion-graphics',
  },
  {
    id: 'toptal',
    name: 'Toptal',
    logoUrl: '/assets/community/logo-toptal.svg',
    logoBg: '#F0F4FF',
    url: 'https://www.toptal.com/designers/jobs',
  },
  {
    id: 'careerbuilder',
    name: 'CareerBuilder',
    logoUrl: '/assets/community/logo-careerbuilder.svg',
    logoBg: '#F0F2FA',
    url: 'https://www.careerbuilder.com/jobs?keywords=UI+UX+designer+AI+developer&location=Remote',
    isDesignFrame: true,
  },
  {
    id: 'wellfound',
    name: 'Wellfound',
    logoUrl: '/assets/community/logo-wellfound.svg',
    logoBg: '#F5F0FF',
    url: 'https://wellfound.com/jobs?role=designer&role=ai-engineer&remote=true',
  },
  {
    id: 'we-work-remotely',
    name: 'We Work Remotely',
    logoUrl: '/assets/community/logo-weworkremotely.svg',
    logoBg: '#EFF6FF',
    url: 'https://weworkremotely.com/remote-jobs/search?term=UI+UX+designer+AI',
    isDesignFrame: true,
  },
  {
    id: 'otta',
    name: 'Otta',
    logoUrl: '/assets/community/logo-otta.svg',
    logoBg: '#F5F5F5',
    url: 'https://app.otta.com/jobs/search?functions=4&functions=8&remote=true',
  },
];
