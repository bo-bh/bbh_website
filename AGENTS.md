# Repository guide for agents

## Validate changes

Run `npm test` before publishing.

## Publish to production

Do not check out `main` and merge into it just to publish a completed branch. This repository may be used by more than one agent or worktree, and an interrupted checkout can leave Git lock files behind.

From a clean branch whose commits should go live, run:

```sh
./scripts/publish-main
```

The helper runs the tests, fetches the current production branch, verifies that the update is a fast-forward, and pushes the current commit directly to `main` without changing the checked-out branch. Netlify deploys `main` automatically.

If Git reports a lock file, do not delete it blindly. First confirm that no Git process is active and that the working tree was not partially changed.
