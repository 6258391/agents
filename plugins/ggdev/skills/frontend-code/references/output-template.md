# Output Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{module-name}</title>
  <link rel="stylesheet" href="shared.css">
  <style>
    /* === Desktop CSS === */
    .section-{name} {
      /* all CSS scoped here */
    }
    /* === Interaction CSS === */
    /* === Responsive CSS === */
  </style>
</head>
<body>
  <section class="section-{name}">
    <!-- semantic HTML from spec Structure -->
  </section>
</body>
</html>
```

- `shared.css` link in head — provides reset + :root variables + body styles
- All module CSS scoped under `.section-{name}`
- Interaction and Responsive markers left empty — other skills fill them
- One `<section>` per module
