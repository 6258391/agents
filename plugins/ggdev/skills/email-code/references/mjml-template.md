# MJML Patterns

## Standalone module template

Each module is a complete, self-contained MJML file — no shared layout files between agents.

```xml
<mjml lang="en">
  <mj-head>
    <mj-preview>{{PreviewText}}</mj-preview>
    <mj-attributes>
      <mj-all font-family="Arial, Helvetica, sans-serif" />
      <mj-text font-size="16px" line-height="24px" color="#333333" padding="0" />
      <mj-section padding="0" />
      <mj-column padding="0" />
    </mj-attributes>
    <mj-style inline="inline">
      a { color: #2563eb; text-decoration: none; }
    </mj-style>
  </mj-head>
  <mj-body background-color="#f4f4f4" width="600px">

    <!-- Header -->
    <mj-section background-color="#ffffff" padding="30px 25px 20px">
      <mj-column>
        <mj-image src="{{LogoUrl}}" alt="{{BrandName}}" width="150px" href="{{SiteUrl}}" />
      </mj-column>
    </mj-section>

    <!-- Content sections -->
    <mj-section background-color="#ffffff" padding="20px 30px 40px">
      <mj-column>
        <mj-text font-size="20px" font-weight="700" color="#111827" padding-bottom="20px">
          Welcome to {{BrandName}}
        </mj-text>
        <mj-text padding-bottom="16px">
          Hi {{UserName}},
        </mj-text>
        <mj-text padding-bottom="24px">
          Your account is ready. Click below to get started.
        </mj-text>
        <mj-button href="{{ActionUrl}}" background-color="#2563eb" color="#ffffff" font-size="16px">
          Get Started
        </mj-button>
        <mj-text padding-top="24px" font-size="13px" color="#6b7280">
          This link expires on {{ExpirationDate}}.
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- Footer -->
    <mj-section background-color="#f9fafb" padding="20px 25px">
      <mj-column>
        <mj-text align="center" font-size="12px" color="#9ca3af">
          &copy; {{Year}} {{BrandName}}. All rights reserved.
        </mj-text>
        <mj-text align="center" font-size="12px" color="#9ca3af" padding-top="8px">
          <a href="{{UnsubscribeUrl}}" style="color: #9ca3af;">Unsubscribe</a>
        </mj-text>
      </mj-column>
    </mj-section>

  </mj-body>
</mjml>
```

## Hero with background image

Use `mj-wrapper` for background spanning sections:

```xml
<mj-wrapper background-url="{{HeroImageUrl}}" background-size="cover"
            background-position="center" padding="60px 30px">
  <mj-section>
    <mj-column>
      <mj-text font-size="32px" font-weight="700" color="#ffffff" align="center">
        {{Heading}}
      </mj-text>
      <mj-text font-size="18px" color="#ffffff" align="center" padding-top="16px">
        {{Subheading}}
      </mj-text>
      <mj-button href="{{CTAUrl}}" background-color="#ffffff" color="#333333"
                  font-size="16px" padding-top="24px">
        {{CTAText}}
      </mj-button>
    </mj-column>
  </mj-section>
</mj-wrapper>
```

## Multi-column

```xml
<mj-section padding="40px 30px">
  <mj-column width="50%" padding-right="10px">
    <mj-image src="{{ImageUrl}}" alt="{{ImageAlt}}" width="270px" />
  </mj-column>
  <mj-column width="50%" padding-left="10px">
    <mj-text font-size="20px" font-weight="700">{{Title}}</mj-text>
    <mj-text padding-top="8px">{{Description}}</mj-text>
  </mj-column>
</mj-section>
```

## Card grid (stacks on mobile automatically)

```xml
<mj-section padding="40px 20px">
  <mj-column width="33.33%" padding="0 10px">
    <mj-image src="{{Icon1Url}}" alt="{{Icon1Alt}}" width="48px" />
    <mj-text font-size="18px" font-weight="700" padding-top="16px">{{Feature1}}</mj-text>
    <mj-text padding-top="8px">{{Feature1Desc}}</mj-text>
  </mj-column>
  <!-- repeat for each card -->
</mj-section>
```

## Footer with social + unsubscribe

```xml
<mj-section background-color="#222222" padding="30px">
  <mj-column>
    <mj-social font-size="16px" icon-size="24px" mode="horizontal">
      <mj-social-element name="facebook" href="{{FacebookUrl}}" />
      <mj-social-element name="instagram" href="{{InstagramUrl}}" />
      <mj-social-element name="twitter" href="{{TwitterUrl}}" />
    </mj-social>
    <mj-text align="center" color="#999999" font-size="12px" padding-top="20px">
      {{CompanyName}} | {{CompanyAddress}}
    </mj-text>
    <mj-text align="center" color="#999999" font-size="12px" padding-top="8px">
      <a href="{{UnsubscribeUrl}}" style="color: #999999;">Unsubscribe</a>
       | <a href="{{PreferencesUrl}}" style="color: #999999;">Preferences</a>
    </mj-text>
  </mj-column>
</mj-section>
```

## Component mapping

| Spec element | MJML component |
|---|---|
| Section | `<mj-section>` or `<mj-wrapper>` (for bg spanning sections) |
| Column layout | `<mj-column width="N%">` inside `<mj-section>` |
| Heading | `<mj-text font-size="32px" font-weight="700">` |
| Paragraph | `<mj-text>` (separate per paragraph, no `<p>` inside) |
| Image | `<mj-image src="https://..." alt="..." width="Npx" />` |
| Button/CTA | `<mj-button href="https://..." background-color="#hex">` |
| Spacer | `<mj-spacer height="20px" />` |
| Divider | `<mj-divider border-color="#cccccc" />` |
| Social icons | `<mj-social>` with `<mj-social-element>` |
| Dynamic text | `{{VariableName}}` |

## Compile

```bash
npx mjml module.mjml -o output.html
```
