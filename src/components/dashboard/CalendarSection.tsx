import type { FC } from 'react';
import { useI18n } from '../../hooks/useI18n';
import type { ClientWorkout } from '../../types/dashboard';

export interface CalendarColumn {
  dayId: string;
  dayLabel: string;
  items: Array<{
    client: string;
    workout: ClientWorkout;
  }>;
}

interface CalendarSectionProps {
  data: CalendarColumn[];
}

const CalendarSection: FC<CalendarSectionProps> = ({ data }) => {
  const { t } = useI18n();

  return (
    <section className="panel panel--calendar">
      <div className="panel__header">
        <div>
          <p className="panel__eyebrow">{t('calendar.eyebrow')}</p>
          <h2>{t('calendar.title')}</h2>
        </div>
        <p className="panel__hint">{t('calendar.hint')}</p>
      </div>
      <div className="calendar-grid">
        {data.map((column) => (
          <div className="calendar-day" key={column.dayId}>
            <h4>{column.dayLabel}</h4>
            {column.items.length === 0 && <p className="calendar-empty">{t('calendar.empty')}</p>}
            {column.items.map(({ client, workout }) => (
              <div className="calendar-chip" key={`${workout.id}-${column.dayId}`}>
                <strong>{workout.name}</strong>
                <span>{client}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
};

export default CalendarSection;
