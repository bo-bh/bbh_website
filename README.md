# borhane.xyz

Production source for Borhane Blili-Hamelin's one-page professional website.

Netlify publishes the self-contained static site in `site/`. The previous Hugo Apéro implementation is preserved on the `archive/hugo-site-2026-07-20` branch.

## Publishing

Commit the finished changes on the working branch, then run:

```sh
./scripts/publish-main
```

The helper validates the site and fast-forward-pushes the current commit directly to the production `main` branch. It deliberately does not check out `main`, so publishing is safe when another worktree has `main` checked out and cannot leave this working tree half-switched if an agent session ends.
