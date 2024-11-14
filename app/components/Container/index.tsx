'use client'

const Container = ({children} : {children: React.ReactNode}) => {
    return ( 
        <div className="my-4 mx-6 flex items-center justify-center">
            {children}
        </div>
     );
}
 
export default Container;