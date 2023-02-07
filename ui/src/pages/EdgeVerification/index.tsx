import { useCompilerBrowser } from "@ethereum-sourcify/lib-sourcify";

const EdgeVerification = () => {
  async function compile() {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const result = await useCompilerBrowser("v0.8.17+commit.8df45f5f", {
      language: "Solidity",
      sources: {
        "test.sol": {
          content: "contract C { function f() public { } }",
        },
      },
      settings: {
        outputSelection: {
          "*": {
            "*": ["*"],
          },
        },
      },
    });
    console.log(result);
  }
  return (
    <div>
      <button onClick={compile}>compile!</button>
    </div>
  );
};

export default EdgeVerification;
