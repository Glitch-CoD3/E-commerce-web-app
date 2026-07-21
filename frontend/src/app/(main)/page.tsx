import Image from "next/image";
import ProductList from "../../components/ProductList";
import { promises } from "dns";

const Homepage = async ({searchParams,} : {searchParams: Promise<{ category: string }> }) => {
  const category = (await searchParams).category;
  return (
    <div className="">
      <div className="relative aspect-3/1 mb-12">
        <Image src="/featured.png" alt="Featured Product" fill />
      </div>
      <ProductList category={category} params="Homepage" />
    </div>
  );
};

export default Homepage;
