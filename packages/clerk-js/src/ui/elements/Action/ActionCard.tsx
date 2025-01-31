import type { ComponentProps } from 'react';

import { Col } from '../../customizables';
import type { InternalTheme } from '../../styledSystem';

type ActionCardProps = ComponentProps<typeof Col> & {
  variant?: 'neutral' | 'destructive';
};

const styles = (t: InternalTheme) => ({
  neutral: {
    backgroundColor: t.colors.$colorBackground,
  },
  destructive: {
    backgroundColor: t.colors.$blackAlpha50,
  },
});

export const ActionCard = (props: ActionCardProps) => {
  const { children, sx, variant = 'neutral', ...rest } = props;

  return (
    <Col
      sx={[
        t => ({
          boxShadow: t.shadows.$actionCardShadow,
          gap: t.space.$4,
          borderRadius: t.radii.$lg,
          padding: t.space.$6,
          border: t.borders.$normal,
          borderColor: t.colors.$blackAlpha150,
          ...styles(t)[variant],
        }),
        sx,
      ]}
      {...rest}
    >
      {children}
    </Col>
  );
};
