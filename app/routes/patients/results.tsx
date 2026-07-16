import { createRoute } from 'honox/factory';
import { PatientTable } from '../../components/patient-table';
import { listPatients } from '../../fhir/patient';

export default createRoute(async (c) => {
  const query = c.req.query('name')?.trim();
  const cursor = c.req.query('cursor');
  const requestedPage = Number(c.req.query('page'));
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const browserParams = new URLSearchParams();
  if (query) browserParams.set('name', query);
  if (cursor) browserParams.set('cursor', cursor);
  if (page > 1) browserParams.set('page', String(page));
  c.header(
    'HX-Push-Url',
    `/patients${browserParams.size ? `?${browserParams}` : ''}`,
  );
  const patients = await listPatients({ name: query, cursor });

  return c.html(
    patients.ok ? (
      <PatientTable
        name={query}
        nextCursor={patients.data.nextCursor}
        page={page}
        patients={patients.data.patients}
        previousCursor={patients.data.previousCursor}
        total={patients.data.total}
      />
    ) : (
      <PatientTable error={patients.message} />
    ),
  );
});
