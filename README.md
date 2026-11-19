# chaOS-seed linting guardrail

Guardrails fetches this subrib and calls its `make test` target. It checks
source files under `bin/`, `hooks/`, `src/`, and `test/` in the supplied
`CHAOS_CHECKOUT` and reports each issue with its file and position.

| Language | Rules |
| --- | --- |
| Python | Parse Python files, reject bare `except`, and require explicit imports. |
| Node.js | Parse JavaScript files, reject `var`, and require strict equality operators. |

The Python check uses the standard library. The Node.js check uses the
parser versions pinned in this repository. Both inspect source without
executing it. Any reported issue fails the target.
[Acorn parser](https://github.com/acornjs/acorn/blob/master/acorn/README.md) · [Acorn walker](https://github.com/acornjs/acorn/blob/master/acorn-walk/README.md)

```sh
CHAOS_CHECKOUT=/path/to/chaOS-seed make test
CHAOS_CHECKOUT=/path/to/chaOS-seed CHAOS_TEST_SCOPE=python make test
```

Run `make lint-python` or `make lint-node` with the same checkout
variable to run an individual language check.
