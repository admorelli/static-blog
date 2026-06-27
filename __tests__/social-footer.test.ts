import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import { SocialFloatingFooter } from '../app/SocialFloatingFooter';

describe('SocialFloatingFooter', () => {
  it.skip('renders three social links with correct hrefs', () => {
    render(createElement(SocialFloatingFooter));

    const footer = screen.getByLabelText('Social');
    expect(footer).toBeTruthy();

    const links = footer.querySelectorAll('a');
    expect(links.length).toBe(3);

    const expected = [
      'https://github.com/admribeiro',
      'https://ko-fi.com/admribeiro',
      'https://linkedin.com/in/admribeiro',
    ];

    expected.forEach((href, idx) => {
      expect(links[idx].getAttribute('href')).toBe(href);
      expect(links[idx].getAttribute('aria-label')).toBe(
        expect.stringContaining(['GitHub', 'Ko-fi', 'LinkedIn'][idx])
      );
      expect(links[idx].getAttribute('target')).toBe('_blank');
    });
  });

  it.skip('renders social icons from official CDN', () => {
    render(createElement(SocialFloatingFooter));

    const footer = screen.getByLabelText('Social');
    const images = footer.querySelectorAll('img');

    expect(images.length).toBe(3);
    Array.from(images).forEach((img) => {
      const src = img.getAttribute('src') || '';
      expect(src).toContain('cdn.simpleicons.org');
    });
  });
});
