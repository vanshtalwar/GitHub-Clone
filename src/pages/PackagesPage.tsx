import { PackageIcon } from '@primer/octicons-react';
import { Blankslate } from '../components/common/Blankslate';

export function PackagesPage() {
  return (
    <section aria-labelledby="packages-heading">
      <h2 id="packages-heading" className="sr-only">
        Packages
      </h2>
      <Blankslate icon={PackageIcon} title="No packages to show">
        <p>GitHub’s API only lists packages to classic access tokens with package permissions.</p>
      </Blankslate>
    </section>
  );
}
