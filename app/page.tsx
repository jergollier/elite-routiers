export default function Home() {
  return (
    <div className="container">
      <div className="overlay"></div>

      <button className="steamBtn">
        <img src="/steam.svg" alt="steam" />
        Connexion avec Steam
      </button>

      <style jsx>{`
        .container {
          width: 100vw;
          height: 100vh;
          background-image: url("/bg.jpg");
          background-size: cover;
          background-position: center;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
        }

        .overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
        }

        .steamBtn {
          position: relative;
          z-index: 2;
          background: #171a21;
          color: white;
          padding: 18px 40px;
          border-radius: 10px;
          font-size: 20px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
        }

        .steamBtn img {
          width: 28px;
          height: 28px;
        }
      `}</style>
    </div>
  );
}