/**
 * Placeholder Image Generator
 * 
 * Generates SVG-based placeholder images for different types.
 * These can be used as temporary placeholders until real images are provided.
 */

import React from 'react';
import { SvgXml } from 'react-native-svg';

/**
 * Generate venue placeholder SVG
 */
export const VenuePlaceholderSVG = ({ width = 400, height = 250 }: { width?: number; height?: number }) => {
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#E5E7EB"/>
      <g transform="translate(${width / 2 - 40}, ${height / 2 - 40})">
        <!-- Building icon -->
        <path d="M0 80h80V10c0-5.52-4.48-10-10-10H10C4.48 0 0 4.48 0 10v70z" fill="#9CA3AF"/>
        <rect x="15" y="20" width="15" height="15" fill="#D1D5DB" rx="2"/>
        <rect x="35" y="20" width="15" height="15" fill="#D1D5DB" rx="2"/>
        <rect x="55" y="20" width="15" height="15" fill="#D1D5DB" rx="2"/>
        <rect x="15" y="45" width="15" height="15" fill="#D1D5DB" rx="2"/>
        <rect x="35" y="45" width="15" height="15" fill="#D1D5DB" rx="2"/>
        <rect x="55" y="45" width="15" height="15" fill="#D1D5DB" rx="2"/>
      </g>
      <text x="${width / 2}" y="${height / 2 + 60}" text-anchor="middle" fill="#6B7280" font-size="14" font-family="Arial">
        Venue Image
      </text>
    </svg>
  `;
  
  return <SvgXml xml={svg} width={width} height={height} />;
};

/**
 * Generate court placeholder SVG
 */
export const CourtPlaceholderSVG = ({ width = 400, height = 250 }: { width?: number; height?: number }) => {
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#DBEAFE"/>
      <g transform="translate(${width / 2 - 60}, ${height / 2 - 40})">
        <!-- Court icon -->
        <rect x="0" y="0" width="120" height="80" fill="#3B82F6" stroke="#1E40AF" stroke-width="2" rx="4"/>
        <line x1="60" y1="0" x2="60" y2="80" stroke="#1E40AF" stroke-width="2"/>
        <circle cx="60" cy="40" r="15" fill="none" stroke="#1E40AF" stroke-width="2"/>
      </g>
      <text x="${width / 2}" y="${height / 2 + 60}" text-anchor="middle" fill="#1E40AF" font-size="14" font-family="Arial">
        Court Image
      </text>
    </svg>
  `;
  
  return <SvgXml xml={svg} width={width} height={height} />;
};

/**
 * Generate avatar placeholder SVG
 */
export const AvatarPlaceholderSVG = ({ size = 100 }: { size?: number }) => {
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#E5E7EB"/>
      <g transform="translate(${size / 2 - 20}, ${size / 2 - 25})">
        <!-- Person icon -->
        <circle cx="20" cy="15" r="12" fill="#9CA3AF"/>
        <path d="M5 50c0-8.28 6.72-15 15-15s15 6.72 15 15" fill="#9CA3AF"/>
      </g>
    </svg>
  `;
  
  return <SvgXml xml={svg} width={size} height={size} />;
};

/**
 * Generate sport placeholder SVG
 */
export const SportPlaceholderSVG = ({ width = 300, height = 200, sportName = 'Sport' }: { width?: number; height?: number; sportName?: string }) => {
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sportGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#10B981;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#047857;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#sportGrad)"/>
      <g transform="translate(${width / 2 - 30}, ${height / 2 - 30})">
        <!-- Generic ball icon -->
        <circle cx="30" cy="30" r="25" fill="none" stroke="#fff" stroke-width="3"/>
        <path d="M10 30 Q30 10 50 30" fill="none" stroke="#fff" stroke-width="2"/>
        <path d="M10 30 Q30 50 50 30" fill="none" stroke="#fff" stroke-width="2"/>
      </g>
      <text x="${width / 2}" y="${height / 2 + 50}" text-anchor="middle" fill="#fff" font-size="18" font-weight="bold" font-family="Arial">
        ${sportName}
      </text>
    </svg>
  `;
  
  return <SvgXml xml={svg} width={width} height={height} />;
};

/**
 * Generate blur placeholder (low quality preview)
 */
export const BlurPlaceholderSVG = ({ width = 400, height = 250, color = '#E5E7EB' }: { width?: number; height?: number; color?: string }) => {
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="blur">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10"/>
        </filter>
      </defs>
      <rect width="${width}" height="${height}" fill="${color}" filter="url(#blur)"/>
    </svg>
  `;
  
  return <SvgXml xml={svg} width={width} height={height} />;
};

/**
 * Get placeholder component by type
 */
export const getPlaceholderComponent = (
  type: 'venue' | 'court' | 'avatar' | 'sport' | 'blur',
  props: any = {}
) => {
  switch (type) {
    case 'venue':
      return <VenuePlaceholderSVG {...props} />;
    case 'court':
      return <CourtPlaceholderSVG {...props} />;
    case 'avatar':
      return <AvatarPlaceholderSVG {...props} />;
    case 'sport':
      return <SportPlaceholderSVG {...props} />;
    case 'blur':
      return <BlurPlaceholderSVG {...props} />;
    default:
      return <VenuePlaceholderSVG {...props} />;
  }
};

export default {
  VenuePlaceholderSVG,
  CourtPlaceholderSVG,
  AvatarPlaceholderSVG,
  SportPlaceholderSVG,
  BlurPlaceholderSVG,
  getPlaceholderComponent,
};
