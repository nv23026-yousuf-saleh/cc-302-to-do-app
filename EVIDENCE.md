# Evidence Pack (auto-generated)

## A. CI Workflow

- Workflow file: `.github/workflows/ci.yml`
- Triggers: `push` and `pull_request` to `main` and `dev`
- Jobs run: lint (`flake8`) + tests (`pytest`)

## B. Controlled CI Failure Demonstration (local)

1. Introduced an intentional failing assertion in `tests/test_crud.py`:
   - Changed `assert resp.status_code == 200` to `assert resp.status_code == 201`
2. Ran tests locally and observed the failure (simulating a CI red state).
3. Restored the assertion to `== 200` and confirmed the suite passes.

## C. Evidence Output

- Passing test run output saved to: `test_run_output.txt`

## D. Notes for GitHub Submission

To complete the assignment as described, you would:

1. Create branch protection rules in GitHub Settings for `dev` (and then `main`):
   - Require pull requests before merging
   - Require status checks to pass
   - Select the CI job (`CI` / `test`) as a required check

2. Create a feature branch, open a PR into `dev`, and push a commit that breaks a test.
3. Observe the PR blocked with the message: “Required checks have not passed.”
4. Fix the test/code, push again, and confirm the CI passes and merge becomes available.

---

*This file is intended to help build the ZIP evidence package requested by the course.*
