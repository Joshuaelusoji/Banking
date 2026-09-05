import HeaderBox from '@/components/HeaderBox'
import TotalBalanceBox from '@/components/TotalBalanceBox';
import React from 'react'

const Home = () => {
  const loggedIn = { firstName: 'Joshua' }; // Example logged-in user object

  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
         <HeaderBox 
          type="greeting"
          title="Welcome"
          user={loggedIn?.firstName || 'Guest'}
          subtext="Access, manage your account and transactions efficiently."
         />

         <TotalBalanceBox
          accounts={[]}
          totalBanks={1}
          totalCurrentBalance={1250.65}
         />
        </header>
      </div>
    </section>
  )
}

export default Home