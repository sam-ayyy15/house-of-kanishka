import type { Metadata } from 'next';
import { InfoPage } from '@/components/info/InfoPage';
import { SIZE_CHART } from '@/lib/sizes';

export const metadata: Metadata = { title: 'Size Guide · House of Kanishka' };

export default function SizeGuidePage() {
  return (
    <InfoPage title="Size Guide" current="/size-guide">
      <p>Sizes are shown as letter size and EU size. Measurements are body measurements in centimetres.</p>
      {/* Placeholder chart: standard EU measurements until the brand's own chart is supplied. */}
      <table>
        <thead>
          <tr>
            <th scope="col">Size</th>
            <th scope="col">Bust</th>
            <th scope="col">Waist</th>
            <th scope="col">Hips</th>
          </tr>
        </thead>
        <tbody>
          {SIZE_CHART.map((r) => (
            <tr key={r.size}>
              <th scope="row">{r.size}</th>
              <td>{r.bust} cm</td>
              <td>{r.waist} cm</td>
              <td>{r.hips} cm</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>How to measure</h2>
      <p>Bust: around the fullest part. Waist: around the narrowest part. Hips: around the fullest part, feet together.</p>
      <p>Between two sizes? Take the larger one for tailoring and the smaller one for stretch dresses.</p>
    </InfoPage>
  );
}
