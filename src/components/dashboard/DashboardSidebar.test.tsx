import { fireEvent, render, screen } from '@testing-library/react';
import DashboardSidebar from './DashboardSidebar';

describe('DashboardSidebar', () => {
  const links = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      description: 'Resumo',
      path: '/dashboard',
      active: true,
    },
    {
      id: 'clients',
      label: 'Clientes',
      description: 'Lista',
      path: '/clients',
      active: false,
    },
  ];

  it('renders every link and highlights the active one', () => {
    render(
      <DashboardSidebar
        brand="CoachFlow"
        ariaLabel="Main navigation"
        links={links}
        quickAgendaTitle="Agenda"
        quickAgendaBody="Detalhes"
        closeLabel="Close"
        isOpen
        onNavigate={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Clientes')).toBeInTheDocument();
    const activeLink = screen.getByText('Dashboard').closest('button');
    expect(activeLink).toHaveClass('sidebar__link--active');
  });

  it('invokes callbacks when navigating or closing', () => {
    const handleNavigate = vi.fn();
    const handleClose = vi.fn();

    render(
      <DashboardSidebar
        brand="CoachFlow"
        ariaLabel="Main navigation"
        links={links}
        quickAgendaTitle="Agenda"
        quickAgendaBody="Detalhes"
        closeLabel="Close"
        isOpen
        onNavigate={handleNavigate}
        onClose={handleClose}
      />,
    );

    fireEvent.click(screen.getByText('Clientes'));
    expect(handleNavigate).toHaveBeenCalledWith('/clients');

    fireEvent.click(screen.getByLabelText('Close'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
