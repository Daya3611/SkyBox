'use client'

import React from 'react'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
  id: string | null
  name: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  currentFolderId: string | null
  onNavigate: (folderId: string | null) => void
}

export default function Breadcrumbs({ items, currentFolderId, onNavigate }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex text-on-surface-variant text-[12px] font-medium mb-1 overflow-x-auto scrollbar-none">
      <ol className="inline-flex items-center space-x-1">
        
        {/* Root - Home */}
        <li className="inline-flex items-center">
          <button
            onClick={() => onNavigate(null)}
            className="inline-flex items-center gap-1 hover:text-primary transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>My Drive</span>
          </button>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={item.id || 'root-nav'} className="inline-flex items-center">
              <ChevronRight className="w-[14px] h-[14px] mx-0.5 text-outline-variant/70" />
              <button
                onClick={() => onNavigate(item.id)}
                disabled={isLast && item.id === currentFolderId}
                className={`transition-colors ${
                  isLast && item.id === currentFolderId 
                    ? 'text-on-surface font-semibold cursor-default' 
                    : 'hover:text-primary'
                }`}
              >
                {item.name}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
