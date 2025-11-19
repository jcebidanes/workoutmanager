import type { FC } from 'react';

export interface SidebarLink {
  id: string;
  label: string;
  description: string;
  path: string;
  active: boolean;
}

interface DashboardSidebarProps {
  brand: string;
  links: SidebarLink[];
  quickAgendaTitle: string;
  quickAgendaBody: string;
  ariaLabel: string;
  closeLabel: string;
  isOpen: boolean;
  onNavigate: (path: string) => void;
  onClose: () => void;
}

const DashboardSidebar: FC<DashboardSidebarProps> = ({
  brand,
  links,
  quickAgendaTitle,
  quickAgendaBody,
  ariaLabel,
  closeLabel,
  isOpen,
  onNavigate,
  onClose,
}) => (
  <>
    <aside className={`app-shell__sidebar ${isOpen ? 'app-shell__sidebar--open' : ''}`}>
      <div className="sidebar__brand">{brand}</div>
      <nav className="sidebar__nav" aria-label={ariaLabel}>
        {links.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`sidebar__link ${item.active ? 'sidebar__link--active' : ''}`}
            onClick={() => onNavigate(item.path)}
          >
            <span>{item.label}</span>
            <span className="sidebar__hint">{item.description}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar__footer">
        <strong>{quickAgendaTitle}</strong>
        <p>{quickAgendaBody}</p>
      </div>
    </aside>
    {isOpen && (
      <button
        type="button"
        className="sidebar-backdrop"
        aria-label={closeLabel}
        onClick={onClose}
      />
    )}
  </>
);

export default DashboardSidebar;
