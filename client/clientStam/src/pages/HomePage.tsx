import { BadgeCheck, BookOpen, DoorClosed, Feather, Gem, ScrollText, ShieldCheck, ShoppingBag, Star } from 'lucide-react'
import { Link } from 'react-router-dom'

const logoUrl = 'https://res.cloudinary.com/dj01kpiv/image/upload/v1792959159/%D7%9C%D7%95%D7%92%D7%95_%D7%94%D7%99%D7%99%D7%98%D7%A7%D7%95%D7%9C%D7%9E%D7%95%D7%AA_%D7%A2%D7%9D_%D7%A7%D7%95%D7%9C%D7%9E%D7%95%D7%A1_%D7%95%D7%A0%D7%95%D7%A6%D7%94.png'

const stories = [
  {
    name: 'יוסף',
    city: 'בני ברק',
    text: 'הקו נשאר אחיד לאורך כל הפרשה, והכתיבה יצאה נקייה.',
  },
  {
    name: 'שמואל',
    city: 'ירושלים',
    text: 'הזמנתי קולמוס למזוזה, והחוד התאים בדיוק לגודל שביקשתי.',
  },
  {
    name: 'דוד',
    city: 'פתח תקוה',
    text: 'קיבלתי מענה מהיר, והקולמוס לספר תורה הגיע שמור היטב.',
  },
]

function Stars() {
  return (
    <span className="stars" aria-label="דירוג מלא">
      <Star aria-hidden="true" />
      <Star aria-hidden="true" />
      <Star aria-hidden="true" />
      <Star aria-hidden="true" />
      <Star aria-hidden="true" />
    </span>
  )
}

function HomePage() {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-inner">
          <div>
            <h1 className="hero-title">היטקולמוס</h1>
            <p className="hero-text">
              קולמוס קרמי הוא כלי כתיבה לסופר סת״ם. החוד עשוי חרס, ולכן עובי הקו
              נשאר קבוע לאורך הכתיבה.
            </p>
            <Link to="/products" className="btn-gold">
              <ShoppingBag aria-hidden="true" />
              הקולמוסים שלנו
            </Link>
          </div>
          <img className="hero-logo" src={logoUrl} alt="" />
        </div>
      </section>

      <section className="home-block">
        <h2 className="section-title">למה היטקולמוס</h2>
        <div className="benefits">
          <article className="benefit">
            <span className="benefit-icon" aria-hidden="true">
              <Gem />
            </span>
            <h3 className="card-title">חומרים איכותיים</h3>
            <p className="line">חוד קרמי ששומר על עובי קו אחיד.</p>
          </article>
          <article className="benefit">
            <span className="benefit-icon" aria-hidden="true">
              <Feather />
            </span>
            <h3 className="card-title">ליווי מקצועי</h3>
            <p className="line">התאמה לכתב אשכנזי או ספרדי.</p>
          </article>
          <article className="benefit">
            <span className="benefit-icon" aria-hidden="true">
              <ShieldCheck />
            </span>
            <h3 className="card-title">משלוח שמור</h3>
            <p className="line">הקולמוס נארז ומגיע שמור.</p>
          </article>
          <article className="benefit">
            <span className="benefit-icon" aria-hidden="true">
              <BadgeCheck />
            </span>
            <h3 className="card-title">אחריות</h3>
            <p className="line">אם משהו לא מתאים, חוזרים אלינו.</p>
          </article>
        </div>
      </section>

      <section className="home-block">
        <h2 className="section-title">חמשת השימושים</h2>
        <div className="use-grid">
          <article className="use-card">
            <span className="use-icon" aria-hidden="true">
              <BookOpen />
            </span>
            <h3 className="card-title">ספר תורה</h3>
          </article>
          <article className="use-card">
            <span className="use-icon" aria-hidden="true">
              <ScrollText />
            </span>
            <h3 className="card-title">מגילה</h3>
          </article>
          <article className="use-card">
            <span className="use-icon" aria-hidden="true">
              <DoorClosed />
            </span>
            <h3 className="card-title">מזוזה</h3>
          </article>
          <article className="use-card">
            <span className="use-icon" aria-hidden="true">
              <ShieldCheck />
            </span>
            <h3 className="card-title">תפילין</h3>
          </article>
          <article className="use-card">
            <span className="use-icon" aria-hidden="true">
              <Feather />
            </span>
            <h3 className="card-title">ייעודים נוספים</h3>
          </article>
        </div>
        <p className="prose-gap">
          בשליחת הפנייה בוחרים אם הקולמוס מיועד לכתב אשכנזי או לכתב ספרדי.
        </p>
        <Link to="/products" className="btn btn-below">
          לכל הקולמוסים
        </Link>
      </section>

      <section className="home-block">
        <h2 className="section-title">לקוחות מספרים</h2>
        <div className="reviews">
          {stories.map((story) => (
            <blockquote key={story.name} className="review">
              <div className="review-top">
                <span className="avatar" aria-hidden="true">
                  {story.name.slice(0, 1)}
                </span>
                <div>
                  <Stars />
                  <p className="line">
                    {story.name}, {story.city}
                  </p>
                </div>
              </div>
              <p>{story.text}</p>
            </blockquote>
          ))}
        </div>
      </section>
    </div>
  )
}

export default HomePage
